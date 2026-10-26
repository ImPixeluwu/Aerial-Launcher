# Publishing a community release

Release repository: https://github.com/ImPixeluwu/Aerial-Launcher

1. Update `package.json`, the root version in `package-lock.json`, and
   `CHANGELOG.md` with the new version and changes.
2. Run `npm ci`, `npm run lint`, and `npm run make` on Windows with Node.js
   22.22.0. Check the packaged app and the features affected by the release.
3. Commit the source and push `main` to the fork.
4. Create a matching tag (for example, `git tag v1.12.5`) and push that tag to
   `origin`. The Release workflow builds the installer and uploads a draft.
5. Review the workflow result, draft assets, and release notes. Attach SHA-256
   checksums and publish the draft from the fork's Releases page.

The workflow uses GitHub's built-in `GITHUB_TOKEN` with `contents: write`; no
personal token needs to be committed or configured as a repository secret.
If Actions is disabled on a new fork, enable the Release workflow in the
repository's Actions tab before pushing a release tag.

Keep release source public under the existing GPL-3.0 license, preserve author
credits, and identify modifications in the changelog. GitHub's tag source
archives provide the matching source for each installer release.

The installer is unsigned. Release notes should say so. The account data folder
is `%APPDATA%\aerial-launcher-data`; it contains credentials and must never be
included in a release, issue, log attachment, or source commit.

`npm run publish` builds and uploads a draft to the repository specified by
`package.json.repository.url`. Run it only with GitHub authentication intended
for that repository. The original author's name is retained for attribution;
it does not determine the publishing destination.
