import type { HomebaseZoneId } from '../../types/homebase'

import { World } from './fortnite/world-info'

export const homebaseZoneIds: Array<HomebaseZoneId> = [
  'pve_01',
  'pve_02',
  'pve_03',
  'pve_04',
]

export const homebaseZoneWorld: Record<HomebaseZoneId, World> = {
  pve_01: World.Stonewood,
  pve_02: World.Plankerton,
  pve_03: World.CannyValley,
  pve_04: World.TwinePeaks,
}

export const homebaseMaxLevel = 10
export const homebaseMaxEnduranceWave = 30
export const homebaseLookupBatchSize = 100
