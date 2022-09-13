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
### Added
- Added support for species tree from gene trees inference using ASTRAL
## [2.0.10] - 2022-09-13
### Changed
- Performance and security updates
## [2.0.9] - 2022-06-30
### Added
- Added substantially more logging in case an error occurrs
### Changed
- Some maintenance and smaller UI updates
### Removed
- Removed ModelTest from Windows 7 and lower
### Fixed
- Fixed problems using RAxML and ModelTest with Mac M1 laptops
## [2.0.8] - 2022-05-09
### Changed
- Updated example files
### Fixed
- Left aligned Run buttom to always be visible
- Made substitution model options available also on selecting GTRCAT for raxml 8.x
- Added GAMMA to non-GTR model labels for raxml 8.x
## [2.0.7] - 2022-02-22
### Changed
- Updated to include the latest binaries for raxml-ng on Mac and Linux (1.1.0).
- Allow copy RAxML command
### Fixed
- Fixed Linux issue running raxml-ng binaries

## [2.0.6] - 2021-10-05
### Changed
- Updated to include the latest binaries for raxml-ng on Mac and Linux (1.0.3).
- Updated to include the latest binaries for RAxML on Windows 8 and 10 (8.2.12).
- A bit of restyling.
### Fixed
- Fixed a bug that only one error could be reported.
- Fixed a bug in outgroup selection.

## [2.0.5] - 2021-05-09
### Added
- Using RAxML 8 you can now select these substitution models for nucleotide data as well: JC69, K80, HKY85.
- ModelTest will also recognize these models if they are the best fit.
### Fixed
- Fixed an error when restarting the app after an update.

## [2.0.4] - 2021-04-22
### Fixed
- Fixed a crash with ModelTest-NG on Windows.

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

