import { observable, action, computed } from 'mobx';
import { clipboard } from 'electron';

export default class Citation {
  @observable visible = false;

  formats = [
    { value: "bib", name: "BibTeX" },
    { value: "ris", name: "RIS/EndNote" },
    { value: "txt", name: "Plain text" },
  ];

  @observable format = "bib";
  @action setFormat = (format) => {
    this.format = format;
  }

  content = [
    {
      name: 'raxmlGUI',
      bib: `@article {Edler800912,
  author = {Edler, Daniel and Klein, Johannes and Antonelli, Alexandre and Silvestro, Daniele},
  title = {raxmlGUI 2.0 beta: a graphical interface and toolkit for phylogenetic analyses using RAxML},
  elocation-id = {800912},
  year = {2019},
  doi = {10.1101/800912},
  publisher = {Cold Spring Harbor Laboratory},
  URL = {https://www.biorxiv.org/content/early/2019/10/10/800912},
  eprint = {https://www.biorxiv.org/content/early/2019/10/10/800912.full.pdf},
  journal = {bioRxiv}
}`,
      ris: `TY  - JOUR
T1  - raxmlGUI 2.0 beta: a graphical interface and toolkit for phylogenetic analyses using RAxML
JF  - bioRxiv
DO  - 10.1101/800912
SP  - 800912
AU  - Edler, Daniel
AU  - Klein, Johannes
AU  - Antonelli, Alexandre
AU  - Silvestro, Daniele
Y1  - 2019/01/01
UR  - http://biorxiv.org/content/early/2019/10/10/800912.abstract
ER  -`,
      txt: `Daniel Edler, Johannes Klein, Alexandre Antonelli, Daniele Silvestro (2019) raxmlGUI 2.0 beta: a graphical interface and toolkit for phylogenetic analyses using RAxML. bioRxiv, doi: https://doi.org/10.1101/800912`,
    },
    {
      name: 'RAxML',
      bib: `@article{10.1093/bioinformatics/btu033,
  author = {Stamatakis, Alexandros},
  title = "{RAxML version 8: a tool for phylogenetic analysis and post-analysis of large phylogenies}",
  journal = {Bioinformatics},
  volume = {30},
  number = {9},
  pages = {1312-1313},
  year = {2014},
  month = {01},
  issn = {1367-4803},
  doi = {10.1093/bioinformatics/btu033},
  url = {https://doi.org/10.1093/bioinformatics/btu033},
  eprint = {http://oup.prod.sis.lan/bioinformatics/article-pdf/30/9/1312/17345185/btu033.pdf},
}`,
      ris: `Provider: Silverchair
Database: Oxford University Press
Content: text/plain; charset="UTF-8"

TY  - JOUR
AU  - Stamatakis, Alexandros
T1  - RAxML version 8: a tool for phylogenetic analysis and post-analysis of large phylogenies
T2  - Bioinformatics
PY  - 2014
Y1  - 2014/01/21/
DO  - 10.1093/bioinformatics/btu033
JO  - Bioinformatics
JA  - bioinformatics
VL  - 30
IS  - 9
SP  - 1312
EP  - 1313
SN  - 1367-4803
Y2  - 10/17/2019
UR  - https://doi.org/10.1093/bioinformatics/btu033
ER  - `,
      txt: `Alexandros Stamatakis, RAxML version 8: a tool for phylogenetic analysis and post-analysis of large phylogenies, Bioinformatics, Volume 30, Issue 9, 1 May 2014, Pages 1312–1313, https://doi.org/10.1093/bioinformatics/btu033`,
    },
    {
      name: 'RAxML-NG',
      bib: `@article{10.1093/bioinformatics/btz305,
    author = {Kozlov, Alexey M and Darriba, Diego and Flouri, Tomáš and Morel, Benoit and Stamatakis, Alexandros},
    title = "{RAxML-NG: a fast, scalable and user-friendly tool for maximum likelihood phylogenetic inference}",
    journal = {Bioinformatics},
    volume = {35},
    number = {21},
    pages = {4453-4455},
    year = {2019},
    month = {05},
    issn = {1367-4803},
    doi = {10.1093/bioinformatics/btz305},
    url = {https://doi.org/10.1093/bioinformatics/btz305},
    eprint = {https://academic.oup.com/bioinformatics/article-pdf/35/21/4453/30330793/btz305.pdf},
}`,
      ris: `Provider: Silverchair
Database: Oxford University Press
Content: text/plain; charset="UTF-8"

TY  - JOUR
AU  - Kozlov, Alexey M
AU  - Darriba, Diego
AU  - Flouri, Tomáš
AU  - Morel, Benoit
AU  - Stamatakis, Alexandros
T1  - RAxML-NG: a fast, scalable and user-friendly tool for maximum likelihood phylogenetic inference
PY  - 2019
Y1  - 2019/05/09/
DO  - 10.1093/bioinformatics/btz305
JO  - Bioinformatics
JA  - Bioinformatics
VL  - 35
IS  - 21
SP  - 4453
EP  - 4455
SN  - 1367-4803
Y2  - 7/17/2020
UR  - https://doi.org/10.1093/bioinformatics/btz305
ER  - `,
      txt: `Alexey M Kozlov, Diego Darriba, Tomáš Flouri, Benoit Morel, Alexandros Stamatakis, RAxML-NG: a fast, scalable and user-friendly tool for maximum likelihood phylogenetic inference, Bioinformatics, Volume 35, Issue 21, 1 November 2019, Pages 4453–4455, https://doi.org/10.1093/bioinformatics/btz305`,
    }
  ];

    // abstract = {RaxmlGUI is a graphical user interface to RAxML, one of the most popular and widely used software for phylogenetic inference using maximum likelihood. Here we present raxmlGUI 2.0-beta, a complete rewrite of the GUI, which replaces raxmlGUI and seamlessly integrates RAxML binaries for all major operating systems providing an intuitive graphical front-end to set up and run phylogenetic analyses. Our program offers automated pipelines for analyses that require multiple successive calls of RAxML and built-in functions to concatenate alignment files while automatically specifying the appropriate partition settings. While the program presented here is a beta version, the most important functions and analyses are already implemented and functional and we encourage users to send us any feedback they may have. RaxmlGUI facilitates phylogenetic analyses by coupling an intuitive interface with the unmatched performance of RAxML.},
  // abstract = "{Motivation: Phylogenies are increasingly used in all fields of medical and biological research. Moreover, because of the next-generation sequencing revolution, datasets used for conducting phylogenetic analyses grow at an unprecedented pace. RAxML (Randomized Axelerated Maximum Likelihood) is a popular program for phylogenetic analyses of large datasets under maximum likelihood. Since the last RAxML paper in 2006, it has been continuously maintained and extended to accommodate the increasingly growing input datasets and to serve the needs of the user community.Results: I present some of the most notable new features and extensions of RAxML, such as a substantial extension of substitution models and supported data types, the introduction of SSE3, AVX and AVX2 vector intrinsics, techniques for reducing the memory requirements of the code and a plethora of operations for conducting post-analyses on sets of trees. In addition, an up-to-date 50-page user manual covering all new RAxML options is available.Availability and implementation: The code is available under GNU GPL at https://github.com/stamatak/standard-RAxML.Contact:alexandros.stamatakis@h-its.orgSupplementary information:Supplementary data are available at Bioinformatics online.}",

  @computed
  get allText() {
    return this.content.map(ref => ref[this.format]).join('\n');
  }

  @action
  show = () => {
    this.visible = true;
  }
  @action
  hide = () => {
    this.visible = false;
  }

  copyToClipboard = () => {
    clipboard.writeText(this.allText);
    console.log('Copied citation to clipboard');
  }
}

