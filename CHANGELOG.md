# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Declared an explicit `exports` map and `sideEffects: false` in `package.json` for
  stricter entry resolution and better web tree-shaking.

## 1.0.3 - 2026-07-16

### Added

- Added `DataTableHandle.scrollToTop()` for resetting vertical position after filtering to a shorter data set.

### Fixed

- Kept the injected selection column after existing left-fixed columns or before existing right-fixed columns.
- Remeasured adaptive columns when row-selection mode or its merged host column changes.

## 1.0.2 - 2026-07-16

### Added

- Full English documentation in `README.en.md`.
- GitHub Actions workflow for publishing to npm through trusted publishing.
- Repository, homepage, and issue tracker metadata for npm.

### Changed

- Reorganized and expanded the Chinese README.

## 1.0.1 - 2026-07-16

### Changed

- Changed the package license to MIT to allow third-party open-source use.

## 1.0.0 - 2026-07-16

### Added

- Initial public release of the React Native data table.
- FlashList v2 virtualization, fixed columns, adaptive widths, row selection,
  controlled sorting, expandable rows, asynchronous sub-tables, themes, and borders.
