# RaxmlGUI2

A desktop GUI for RAxML.

## Development

This is a an [Electron](https://electronjs.org/) App that was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

```yarn start``` will start the Electron app and the React app at the same time.  
```yarn build``` will build the React app and package it along the Electron app.


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
