# RaxmlGUI2

A desktop GUI for RAxML.

## Development

This is an [Electron](https://electronjs.org/) app. The shell is built with electron-vite.

```yarn start``` starts the shell.  
```yarn build``` compiles the shell into `out/`.  
```yarn build-mac```, ```yarn build-win```, and ```yarn build-linux``` compile the shell, then pack it with electron-builder.

### End-to-end tests

`yarn test:e2e` builds the shell, then [Playwright](https://playwright.dev/) launches `out/main/index.js`. There is no dev server. Specs in `e2e/` check the UI and output files:

- `modeltest-then-raxml-ng.spec.js` — ModelTest, then a full raxml-ng analysis
- `raxmlHPC.spec.js` — classic raxmlHPC (ML search)

Download binaries once, then run:

```bash
yarn download-binaries
yarn test:e2e
```

The launch sets `RAXMLGUI_E2E=1`. That skips auto-update checks and points the main process at the repo `static/` directory (example files, binaries, and test output). The built page loads that example alignment from the same flag.


## Input formats
RaxmlGUI supports both FASTA and PHYLIP format.

The strict phylip format reserves the first ten characters before each sequence for the name.
The relaxed format allows longer name but requires no space within the name to know where it ends.

### Examples

#### Phylip interleaved strict
```
      5    42
Turkey    AAGCTNGGGC ATTTCAGGGT
Salmo gairAAGCCTTGGC AGTGCAGGGT
H. SapiensACCGGTTGGC CGTTCAGGGT
Chimp     AAACCCTTGC CGTTACGCTT
Gorilla   AAACCCTTGC CGGTACGCTT

GAGCCCGGGC AATACAGGGT AT
GAGCCGTGGC CGGGCACGGT AT
ACAGGTTGGC CGTTCAGGGT AA
AAACCGAGGC CGGGACACTC AT
AAACCATTGC CGGTACGCTT AA
```

#### Phylip interleaved relaxed
```
      5    42
Turkey     AAGCTNGGGC ATTTCAGGGT
Salmo_gair AAGCCTTGGC AGTGCAGGGT
H._Sapiens ACCGGTTGGC CGTTCAGGGT
Chimp      AAACCCTTGC CGTTACGCTT
Gorilla    AAACCCTTGC CGGTACGCTT

GAGCCCGGGC AATACAGGGT AT
GAGCCGTGGC CGGGCACGGT AT
ACAGGTTGGC CGTTCAGGGT AA
AAACCGAGGC CGGGACACTC AT
AAACCATTGC CGGTACGCTT AA
```

#### Phylip sequential strict
```
  5    42
Turkey    AAGCTNGGGC ATTTCAGGGT
GAGCCCGGGC AATACAGGGT AT
Salmo gairAAGCCTTGGC AGTGCAGGGT
GAGCCGTGGC CGGGCACGGT AT
H. SapiensACCGGTTGGC CGTTCAGGGT
ACAGGTTGGC CGTTCAGGGT AA
Chimp     AAACCCTTGC CGTTACGCTT
AAACCGAGGC CGGGACACTC AT
Gorilla   AAACCCTTGC CGGTACGCTT
AAACCATTGC CGGTACGCTT AA
```

#### Phylip sequential relaxed
```
  5    42
Turkey     AAGCTNGGGC ATTTCAGGGT
GAGCCCGGGC AATACAGGGT AT
Salmo_gair AAGCCTTGGC AGTGCAGGGT
GAGCCGTGGC CGGGCACGGT AT
H._Sapiens ACCGGTTGGC CGTTCAGGGT
ACAGGTTGGC CGTTCAGGGT AA
Chimp      AAACCCTTGC CGTTACGCTT
AAACCGAGGC CGGGACACTC AT
Gorilla    AAACCCTTGC CGGTACGCTT
AAACCATTGC CGGTACGCTT AA
```

#### MacOS code-signing and notarizing
https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db
https://github.com/electron/electron-notarize
https://stackoverflow.com/questions/53112078/how-to-upload-dmg-file-for-notarization-in-xcode/53121755#53121755

#### Publishing with electron-builder
Need to have a GH_TOKEN in your shell env

#### Binaries
The binaries for RAxML on MacOS were compiled from this repository: https://github.com/jtklein/standard-RAxML

