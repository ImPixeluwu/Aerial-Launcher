import type { PartyData } from '../../types/services/party'

import { describe, expect, it } from 'vitest'

import { PartyRole } from '../../config/constants/fortnite/party'

import {
  buildPartyPrivacyPatch,
  getPartyLeaderId,
  getPartyMembersWithoutName,
  parsePartyInfo,
} from './party-info'

const ids = {
  leader: 'a'.repeat(32),
  first: 'b'.repeat(32),
  second: 'c'.repeat(32),
}

function member(
  accountId: string,
  role: PartyRole,
  joinedAt: string,
  name?: string,
): PartyData['members'][number] {
  return {
    account_id: accountId,
    meta: name ? { 'urn:epic:member:dn_s': name } : {},
    connections: [],
    revision: 0,
    updated_at: joinedAt,
    joined_at: joinedAt,
    role,
  }
}

function party(
  joinability: PartyData['config']['joinability'],
  meta: Record<string, string> = {},
): PartyData {
  return {
    id: 'party-id',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    config: {
      type: 'DEFAULT',
      joinability,
      discoverability: joinability === 'OPEN' ? 'ALL' : 'INVITED_ONLY',
      sub_type: 'default',
      max_size: 4,
      invite_ttl: 14400,
      join_confirmation: false,
      intention_ttl: 60,
    },
    members: [
      member(ids.second, PartyRole.MEMBER, '2026-01-01T00:03:00Z'),
      member(ids.leader, PartyRole.CAPTAIN, '2026-01-01T00:02:00Z', 'Leader'),
      member(ids.first, PartyRole.MEMBER, '2026-01-01T00:01:00Z', 'First'),
    ],
    applicants: [],
    meta,
    invites: [],
    revision: 12,
    intentions: [],
  }
}

describe('parsePartyInfo', () => {
  it('puts the leader first, then the members by join date', () => {
    const result = parsePartyInfo(party('OPEN'), { [ids.second]: 'Second' })

    expect(result.members.map((current) => current.displayName)).toEqual([
      'Leader',
      'First',
      'Second',
    ])
    expect(result.members[0].isLeader).toBe(true)
    expect(result.size).toBe(3)
    expect(result.maxSize).toBe(4)
    expect(result.partyId).toBe('party-id')
  })

  it('reads the privacy from the joinability', () => {
    expect(parsePartyInfo(party('OPEN')).isPrivate).toBe(false)
    expect(parsePartyInfo(party('INVITE_AND_FORMER')).isPrivate).toBe(true)
  })

  it('lists the members without a name and finds the leader', () => {
    expect(getPartyMembersWithoutName(party('OPEN'))).toEqual([ids.second])
    expect(getPartyLeaderId(party('OPEN'))).toBe(ids.leader)
    expect(parsePartyInfo(party('OPEN')).members[2].displayName).toBeNull()
  })
})

describe('buildPartyPrivacyPatch', () => {
  const privacyMeta = {
    'Default:PrivacySettings_j': JSON.stringify({
      PrivacySettings: {
        partyType: 'Public',
        partyInviteRestriction: 'AnyMember',
        bOnlyLeaderFriendsCanJoin: false,
        bUseCustomPrivacy: true,
      },
    }),
  }

  it('builds the private preset', () => {
    const body = buildPartyPrivacyPatch(party('OPEN', privacyMeta), true)

    expect(body.config).toEqual({
      join_confirmation: false,
      joinability: 'INVITE_AND_FORMER',
      max_size: 4,
      discoverability: 'INVITED_ONLY',
    })
    expect(body.party_privacy_type).toBe('INVITE_AND_FORMER')
    expect(body.revision).toBe(12)
    expect(body.meta.delete).toEqual(['urn:epic:cfg:not-accepting-members'])
    expect(body.meta.update).toMatchObject({
      'urn:epic:cfg:presence-perm_s': 'Noone',
      'urn:epic:cfg:accepting-members_b': 'false',
      'urn:epic:cfg:invite-perm_s': 'Leader',
      'urn:epic:cfg:not-accepting-members-reason_i': '7',
    })
    expect(
      JSON.parse(body.meta.update['Default:PrivacySettings_j']),
    ).toEqual({
      PrivacySettings: {
        partyType: 'Private',
        partyInviteRestriction: 'LeaderOnly',
        bOnlyLeaderFriendsCanJoin: true,
        bUseCustomPrivacy: true,
      },
    })
    expect(body).toMatchObject({
      party_type: 'DEFAULT',
      party_sub_type: 'default',
      max_number_of_members: 4,
      invite_ttl_seconds: 14400,
      party_state_overridden: {},
    })
  })

  it('builds the public preset', () => {
    const body = buildPartyPrivacyPatch(
      party('INVITE_AND_FORMER', privacyMeta),
      false,
    )

    expect(body.config.joinability).toBe('OPEN')
    expect(body.config.discoverability).toBe('ALL')
    expect(body.party_privacy_type).toBe('OPEN')
    expect(body.meta.delete).toEqual([
      'urn:epic:cfg:not-accepting-members-reason_i',
    ])
    expect(body.meta.update).toEqual({
      'Default:PrivacySettings_j': JSON.stringify({
        PrivacySettings: {
          partyType: 'Public',
          partyInviteRestriction: 'AnyMember',
          bOnlyLeaderFriendsCanJoin: false,
          bUseCustomPrivacy: true,
        },
      }),
      'urn:epic:cfg:presence-perm_s': 'Anyone',
      'urn:epic:cfg:accepting-members_b': 'true',
      'urn:epic:cfg:invite-perm_s': 'Anyone',
    })
  })

  it('does not add the privacy settings when the party has none', () => {
    const body = buildPartyPrivacyPatch(party('OPEN'), true)

    expect(body.meta.update['Default:PrivacySettings_j']).toBeUndefined()
  })
})
