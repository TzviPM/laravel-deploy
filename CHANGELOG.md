# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] - 2023-10-30

### Fixed
- Fix null values propagating through the code ([#11](https://github.com/TzviPM/laravel-deploy/pull/11)).
- Use stricter settings in TS Config ([#11](https://github.com/TzviPM/laravel-deploy/pull/11)).

## [1.2.1] - 2023-10-30

### Fixed
- Backups are now deleted upon closing a pull reques.
- Misc fixes for comments.

## [1.2.0] - 2023-10-30

### Added
- Resources are now deleted upon closing a pull request ([#9](https://github.com/TzviPM/laravel-deploy/pull/9)).
- Merging a PR now creates a deploy request in PlanetScale ([#9](https://github.com/TzviPM/laravel-deploy/pull/9)).
- Comments are now created upon succesfully completing an action ([#10](https://github.com/TzviPM/laravel-deploy/pull/10)).

## [1.1.0] - 2023-10-30

### Added
- A new parameter, `branches`, allows custom mappings from git branches to planetscale branches ([#6](https://github.com/TzviPM/laravel-deploy/pull/6)).

### Fixed
- PlanetScale now waits for a backup to complete before attempting to restore it in a new branch ([#6](https://github.com/TzviPM/laravel-deploy/pull/6)).

## [1.0.4] - 2023-10-27

### Fixed
- Log severity is now more sensible for running info logs ([#5](https://github.com/TzviPM/laravel-deploy/pull/5)).

## [1.0.3] - 2023-10-27

### Fixed
- Url parts generated from branch names are now valid ([#4](https://github.com/TzviPM/laravel-deploy/pull/4)).

## [1.0.2] - 2023-10-27

### Fixed
- Debug logs are now emitted in CI ([#3](https://github.com/TzviPM/laravel-deploy/pull/3)).

## [1.0.1] - 2023-10-27

### Fixed
- Set `php-version` as an input in `action.yml` ([#2](https://github.com/TzviPM/laravel-deploy/pull/2)).

## [1.0.0] - 2023-10-27

This was the initial release of `laravel-deploy`.

[unreleased]: https://github.com/TzviPM/laravel-deploy/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/TzviPM/laravel-deploy/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/TzviPM/laravel-deploy/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/TzviPM/laravel-deploy/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/TzviPM/laravel-deploy/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/TzviPM/laravel-deploy/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/TzviPM/laravel-deploy/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/TzviPM/laravel-deploy/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/TzviPM/laravel-deploy/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/TzviPM/laravel-deploy/releases/tag/v1.0.0