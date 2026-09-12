# Changelog

## 1.12.4 — 2026-09-12

First community release maintained by [Xpert420](https://github.com/FIZZCD),
based on [Ciensprog/Aerial-Launcher](https://github.com/Ciensprog/Aerial-Launcher)
version 1.12.3. This is a modified version, maintained independently of the
original project.

- Fixed alerts authentication: `/world/info` uses a saved account's user access
  token through the existing validation and renewal flow. At least one account
  must be added to the launcher.
- Marked Kick, Taxi Service, Kick All Party, Leave Party, and the related
  claim-after-leaving options as temporarily unavailable.
- Prevented saved Kick and Taxi settings from starting unavailable operations.
- Kept Claim, Transfer mats, and manual Claim Rewards available.
- Made disabled account selectors also disable their clear button.
- Pointed release checks, downloads, and support to the community fork.
- Retained the original author credits, license, history, and account data path.

Validation: lint, browser interaction checks with sample accounts, and mocked
authentication and background-operation checks pass. The original repository's
410 TypeScript diagnostics are not addressed by this maintenance release.
