# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Types of changes
### Added
for new features.
### Changed
for changes in existing functionality.
### Deprecated
for soon-to-be removed features.
### Removed
for now removed features.
### Fixed
for any bug fixes.
### Security
in case of vulnerabilities.

## [Unreleased] - YYYY-MM-DD

## [2.0.3] - 2021-04-14
### Added
- Modeltest-NG is now also available on Windows (Tested on Windows 10 only).
### Fixed
- Fixed some smaller styling issues.

## [2.0.2] - 2021-03-29
### Added
- Display more detailed information when an input alignment has been modified.
- Allow completely unknown binary sequences.
### Fixed
- Small bugfix: Remove "null" showing up in SnackBar text

## [2.0.1] - 2021-03-04
### Added
- Some common errors in alignments will be automatically fixed when loading an alignment. This includes, replacing illegal characters with underscores in taxon names, disambiguating duplicated taxon names, shortening taxon names that are too long.
### Changed
- Updated to include the latest binaries for raxml-ng on Mac and Linux (1.0.1).
### Fixed
- Now correctly recognizes ? and N in nucleotide sequences.
- Fixed a small bug that showed output files that are not a result of the actual analysis.
- Added the correct citation for the release paper.
- Fixed a bug where selecting the output dir would lead to the change in all tabs.
- Fixed a bug where adding an alignment would add it in all tabs. 
- Fixed a crash when running ModelTest-NG on binary or multistate alignments.
- Fixed a crash when the input alignment did not exist when starting a run.
- Fixed a bug that deleted last parts of a taxon names with whitespaces. 

## [2.0.0] - 2017-06-20

