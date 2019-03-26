/*
    JavaScript representation of the possible settings for the major analysis types
    title: The title to display for a dropdown menu
    argsList: The arguments that are minimum needed to perform one run with RAxML,
    each object contains arguments for one run that are chained together.
*/
const analysesOptions = [
  {
    title: 'Fast tree search',
    value: 'FT',
    argsList: [
      // The first RAxML call for this analysis type
      // Daniele ???
      // = Fast tree search ???
      {
        T: undefined,
        f: 'E',
        p: undefined,
        m: undefined,
        n: undefined,
        s: undefined,
        O: undefined,
        w: undefined,
        // Add when datataype is multistate
        K: undefined,
        // Add when data is partitioned
        q: undefined,
        M: undefined
        // TODO fast tree search has outgroup select, but args are not changed from it
      }
      // Option to chain on brL
      // Option to chain on SH_like values
    ],
    outputExt: '.tre',
    outputPrefix: 'RAxML_fastTree.'
  },
  {
    title: 'ML search',
    value: 'ML',
    argsList: [
      // Daniele ???
      // = basic ML search ???
      {
        T: undefined,
        f: 'd',
        m: undefined,
        N: undefined, // number of runs
        O: undefined,
        p: undefined,
        s: undefined,
        n: undefined,
        w: undefined,
        // optional = outgroup
        o: undefined
      }
      // Option to chain on SH_like values
      // One analysis chains on in the command line:
      // cat RAxML_result.combi13.tre* > combined_results.combi13.tre
    ],
    outputExt: '.tre'
  },
  {
    title: 'ML + rapid bootstrap',
    value: 'ML+BS',
    argsList: [
      // Daniele ???
      // = basic ML + rapid BS ???
      {
        T: undefined,
        f: 'a',
        x: undefined,
        m: undefined,
        p: undefined,
        N: undefined,
        O: undefined,
        s: undefined,
        n: undefined,
        w: undefined,
        // This one is optional (=BS brL)
        k: undefined,
        // optional = outgroup
        o: undefined,
        // Add when partitioned
        q: undefined,
        M: undefined
      }
    ],
    outputExt: '.tre'
  }, // default
  {
    title: 'ML + thorough bootstrap',
    value: 'ML+tBS',
    argsList: [
      {
        T: undefined,
        b: undefined,
        m: undefined,
        p: undefined,
        N: undefined,
        s: undefined,
        // This out file is -z in last run, handled in electron thread
        n: undefined,
        w: undefined,
        O: undefined,
        // next one optional
        k: undefined, // = BS brL
        // optional
        o: undefined // outgroup option
      },
      {
        T: undefined,
        f: 'd',
        m: undefined,
        s: undefined,
        N: undefined,
        // This out file is -t in last run, handled in electron thread
        n: undefined,
        p: undefined,
        w: undefined,
        O: undefined,
        // optional
        o: undefined
      },
      {
        T: undefined,
        f: 'b',
        t: undefined,
        z: undefined,
        m: undefined,
        s: undefined,
        n: undefined,
        w: undefined
      }
    ],
    outputExt: '.tre'
  },
  {
    title: 'Bootstrap + consensus',
    value: 'BS+con',
    argsList: [
      {
        T: undefined,
        m: undefined,
        n: undefined,
        s: undefined,
        x: undefined,
        N: undefined,
        w: undefined,
        p: undefined,
        O: undefined,
        // next one optional
        k: undefined, // = BS brL
        // optional = outgroup
        o: undefined
      },
      {
        T: undefined,
        m: undefined,
        n: undefined,
        J: undefined,
        z: undefined,
        w: undefined
      }
    ],
    outputExt: '.con.tre'
  },
  {
    title: 'Ancestral states',
    value: 'AS',
    argsList: [
      {
        T: undefined,
        f: 'A',
        t: undefined,
        s: undefined,
        m: undefined,
        n: undefined,
        O: undefined,
        w: undefined
      }
    ],
    // TODO what makes sense here
    outputExt: '.sta'
  },
  {
    title: 'Pairwise distances',
    value: 'PD',
    argsList: [
      {
        T: undefined,
        f: 'x',
        p: undefined,
        s: undefined,
        m: undefined,
        n: undefined,
        O: undefined,
        w: undefined,
        // Optional
        t: undefined
      }
    ],
    outputExt: '.tre'
  },
  {
    title: 'RELL bootstraps',
    value: 'RBS',
    argsList: [
      {
        T: undefined,
        f: 'D',
        p: undefined,
        s: undefined,
        m: undefined,
        n: undefined,
        O: undefined,
        w: undefined
      }
    ],
    outputExt: '.tre'
  }
];

const shlike = [
  {
    title: 'SH-like values',
    value: 'SH',
    argsList: [
      // Daniele ???
      // = SH_like values ???
      {
        T: undefined,
        f: 'J',
        m: undefined,
        // Is the result of the previous run
        t: undefined,
        n: undefined,
        s: undefined,
        p: undefined,
        O: undefined,
        w: undefined,
        // Add when datataype is multistate
        K: undefined,
        // Add when data is partitioned
        q: undefined,
        M: undefined
      }
    ],
    outputExt: '.SH.tre'
  }
];

const brL = [
  {
    title: 'br length',
    value: 'brL',
    argsList: [
      // Daniele ???
      // = compute brLength ???
      {
        T: undefined,
        f: 'e',
        m: undefined,
        // Is the result of the previous run
        t: undefined,
        n: undefined,
        s: undefined,
        O: undefined,
        w: undefined,
        // Add when datataype is multistate
        K: undefined,
        // Add when data is partitioned
        q: undefined,
        M: undefined
      }
    ],
    outputExt: '.brL.tre',
    outputPrefix: 'RAxML_result.'
  }
];

const settings = {
  analysesOptions,
  shlike,
  brL
};

export { settings };
