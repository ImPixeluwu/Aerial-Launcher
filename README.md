# Aerial Launcher — Community Fork

A Windows launcher for managing Fortnite Save the World accounts, alerts, and rewards.
This fork is maintained by [Xpert420](https://github.com/FIZZCD) and is based on
[Ciensprog/Aerial-Launcher](https://github.com/Ciensprog/Aerial-Launcher), originally
based on Potato Launcher. It is maintained independently of the original developer
and is not affiliated with Epic Games.

**[Download the latest community release](https://github.com/FIZZCD/Aerial-Launcher/releases/latest)**
· **[Report an issue](https://github.com/FIZZCD/Aerial-Launcher/issues)**
· **[Changelog](CHANGELOG.md)**

## Version 1.12.4

- Alerts use a saved account's user access token, renewing it when needed.
- Kick, Taxi Service, Kick All Party, Leave Party, and their claim-after-leaving
  options remain visible but are temporarily disabled.
- Claim, Transfer mats, and manual Claim Rewards remain available.
- Update notifications and release links point to this community fork.

At least one account must be added to load alerts. Other features are inherited
from the original project; this maintenance release does not claim to fix them all.

## Install or update

1. Download `Aerial Launcher-1.12.4 Setup.exe` from this fork's
   [Releases page](https://github.com/FIZZCD/Aerial-Launcher/releases).
2. Close the launcher, then run the installer. The installer is unsigned, so
   Windows may display a publisher or SmartScreen warning.
3. Open the launcher and check your accounts and settings.

Existing settings are stored in `%APPDATA%\aerial-launcher-data`. The community
fork retains this path and application identity for compatibility. Back up that
folder before replacing an existing installation. It includes account credentials;
keep the backup private and never attach it to an issue.

Release assets include SHA-256 checksums. To calculate an installer's checksum in
PowerShell, run `Get-FileHash -Algorithm SHA256 -LiteralPath 'path-to-installer.exe'`.

## Build from source

Use Windows, Git, and Node.js 22.22.0:

```powershell
git clone https://github.com/FIZZCD/Aerial-Launcher.git
cd Aerial-Launcher
npm ci
npm run lint
npm start
```

Run `npm run make` to build the Windows installer. Output is written to
`out/make/squirrel.windows/x64`. Release maintainers can follow
[the release guide](docs/RELEASING.md).

The repository currently has inherited TypeScript diagnostics. Lint, production
builds, and targeted runtime checks are used for this maintenance release; a clean
TypeScript check is not claimed.

## Credits and license

Original development, design credits, and history belong to Ciensprog and the
original contributors. The [original README](docs/UPSTREAM-README.md) is preserved
for attribution and historical documentation. Its release and support links refer
to the upstream project. Existing sponsor links support the original author.

This modified version remains under [GPL-3.0](LICENSE). Modification dates and
release changes are documented in [CHANGELOG.md](CHANGELOG.md). The source matching
each installer is available from its release tag and GitHub source archives.

Contributions and bug reports for this fork are welcome in
[FIZZCD/Aerial-Launcher](https://github.com/FIZZCD/Aerial-Launcher).
