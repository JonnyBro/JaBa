# Changelog

I'll try to keep this up to date.

----

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Music: No "Current track" embed if there is no more tracks in the queue

## [5.2.1] - 2025-06-29 (includes changes from 5.1.5 to 5.2.0)

### Added

- CI/CD: GitHub Actions workflows:
  - Automatic Docker container build and publish to `ghcr.io`.
  - Automatic releases on tags push.
- Music: New `/next` command to queue a track to play after the current one
- UI: "Current track" embed now displays the next upcoming track
- DevOps: Added MongoDB healthcheck to Docker Compose configuration
- Build: Added rimraf to clean dist folder during build process
- UX: Bot version (from package.json) now shown in default footer in production mode

### Fixed

- Birthday notifications: Resolved occasional error in birthday announcements
- Birthday messages: Fixed duplicate birthday messages being sent

### Changed

- Dependencies: Updated `discord.js`, `tsx`, `tsc-alias`, and `prettier-eslint` to latest versions
- Documentation: Various improvements to README.md

## [5.1.4] - 2025-06-12

### Breaking Changes ⚠️

- Database: Renamed `bankSold` to `bank` in database schema (migration code included as of 5.2.1; i forgor 💀)

### Changed

- Command Structure: Refactored multiple commands to use subcommands:
  - `/avatar`, `/setbio`, `/birthdate`, and `/bank` commands now use subcommand structure
  - `/config` command reorganized with separate subcommands for each setting

### Removed

- Localization: Removed legacy language files (to be replaced with new translations)

## [5.1.3] - 2025-06-09

### Added

- Maintenance: Automated task to clean up deleted users from database
- Music: Added autoplay functionality for non-YouTube tracks

### Fixed

- Message handling: Resolved issues with message processing
- Link quoting: Fixed functionality of link quote feature
- Music Player:
  - Fixed loop button in trackStart embed
  - Fixed player destruction on stop command
- Birthdays: Bot now properly reacts to birthday announcements

### Changed

- Developer: `/eval` command now supports `await` for asynchronous functions

## [5.1.2] - 2025-06-26

### Added

- Refactoring: Migrated several commands to TypeScript:
  - `/help`, `/info`, context command `Add to Queue`
- Infrastructure:
  - Added Rainlink's (music player) events handlers
  - Implemented database model validators
  - Added Docker support (Dockerfile and Docker Compose)
- Events: Rewrote guild events in TypeScript

### Fixed

- Database: Resolved data persistence issues by using `.set()` method
- Music:
  - Fixed `/queue` command error when tracks lack artwork
  - Resolved localization issues with `/loop` command

### Changed

- Localization: Improved `translateContext` function to accept multiple input types
- UX: Added message length validation before granting XP
- Configuration: `/config language` now dynamically loads available languages

### Removed

- Features: Removed AFK status functionality

> Note: Previous versions involved a complete TypeScript rewrite of the codebase.
