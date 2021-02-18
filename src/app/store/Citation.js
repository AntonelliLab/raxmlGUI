import { observable, action, computed } from 'mobx';
import { clipboard } from 'electron';

export default class Citation {
  @observable visible = false;

  formats = [
    { value: 'bib', name: 'BibTeX' },
    { value: 'ris', name: 'RIS/EndNote' },
    { value: 'txt', name: 'Plain text' },
  ];

  @observable format = 'bib';
  @action setFormat = (format) => {
    this.format = format;
  };

  content = [
    {
      name: 'raxmlGUI',
      bib: `@article{https://doi.org/10.1111/2041-210X.13512,
author = {Edler, Daniel and Klein, Johannes and Antonelli, Alexandre and Silvestro, Daniele},
title = {raxmlGUI 2.0: A graphical interface and toolkit for phylogenetic analyses using RAxML},
journal = {Methods in Ecology and Evolution},
volume = {12},
number = {2},
pages = {373-377},
keywords = {bioinformatics, evolutionary biology, molecular biology, phylogenetics, software},
doi = {https://doi.org/10.1111/2041-210X.13512},
url = {https://besjournals.onlinelibrary.wiley.com/doi/abs/10.1111/2041-210X.13512},
eprint = {https://besjournals.onlinelibrary.wiley.com/doi/pdf/10.1111/2041-210X.13512},
year = {2021}
}`,
      ris: `
TY  - JOUR
T1  - raxmlGUI 2.0: A graphical interface and toolkit for phylogenetic analyses using RAxML
AU  - Edler, Daniel
AU  - Klein, Johannes
AU  - Antonelli, Alexandre
AU  - Silvestro, Daniele
Y1  - 2021/02/01
PY  - 2021
DA  - 2021/02/01
N1  - https://doi.org/10.1111/2041-210X.13512
DO  - https://doi.org/10.1111/2041-210X.13512
T2  - Methods in Ecology and Evolution
JF  - Methods in Ecology and Evolution
JO  - Methods in Ecology and Evolution
JA  - Methods Ecol Evol
SP  - 373
EP  - 377
VL  - 12
IS  - 2
KW  - bioinformatics
KW  - evolutionary biology
KW  - molecular biology
KW  - phylogenetics
KW  - software
PB  - John Wiley & Sons, Ltd
SN  - 2041-210X
M3  - https://doi.org/10.1111/2041-210X.13512
UR  - https://doi.org/10.1111/2041-210X.13512
Y2  - 2021/02/18
ER  - 
`,
      txt: `Edler, D, Klein, J, Antonelli, A, Silvestro, D. raxmlGUI 2.0: A graphical interface and toolkit for phylogenetic analyses using RAxML. Methods Ecol Evol. 2021; 12: 373– 377. https://doi.org/10.1111/2041-210X.13512`,
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
    },
    {
      name: 'ModelTest-NG',
      bib: `@article{10.1093/molbev/msz189,
    author = {Darriba, Diego and Posada, David and Kozlov, Alexey M and Stamatakis, Alexandros and Morel, Benoit and Flouri, Tomas},
    title = "{ModelTest-NG: A New and Scalable Tool for the Selection of DNA and Protein Evolutionary Models}",
    journal = {Molecular Biology and Evolution},
    volume = {37},
    number = {1},
    pages = {291-294},
    year = {2019},
    month = {08},
    issn = {0737-4038},
    doi = {10.1093/molbev/msz189},
    url = {https://doi.org/10.1093/molbev/msz189},
    eprint = {https://academic.oup.com/mbe/article-pdf/37/1/291/32085561/msz189.pdf},
}`,
      ris: `Provider: Silverchair
Database: Oxford University Press
Content: text/plain; charset="UTF-8"

TY  - JOUR
AU  - Darriba, Diego
AU  - Posada, David
AU  - Kozlov, Alexey M
AU  - Stamatakis, Alexandros
AU  - Morel, Benoit
AU  - Flouri, Tomas
T1  - ModelTest-NG: A New and Scalable Tool for the Selection of DNA and Protein Evolutionary Models
PY  - 2020
Y1  - 2020/01/01
DO  - 10.1093/molbev/msz189
JO  - Molecular Biology and Evolution
JA  - Mol Biol Evol
VL  - 37
IS  - 1
SP  - 291
EP  - 294
SN  - 0737-4038
Y2  - 9/5/2020
UR  - https://doi.org/10.1093/molbev/msz189
ER  - `,
      txt: `Diego Darriba, David Posada, Alexey M Kozlov, Alexandros Stamatakis, Benoit Morel, Tomas Flouri, ModelTest-NG: A New and Scalable Tool for the Selection of DNA and Protein Evolutionary Models, Molecular Biology and Evolution, Volume 37, Issue 1, January 2020, Pages 291–294, https://doi.org/10.1093/molbev/msz189`,
    },
  ];

  @computed
  get allText() {
    return this.content.map((ref) => ref[this.format]).join('\n');
  }

  @action
  show = () => {
    this.visible = true;
  };
  @action
  hide = () => {
    this.visible = false;
  };

  copyToClipboard = () => {
    clipboard.writeText(this.allText);
    console.log('Copied citation to clipboard');
  };
}

