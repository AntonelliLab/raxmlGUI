// The command pins: the exact argument lists today's Run builds, one table for both platform test files.
// The store is imported inside pinCommands, so the Windows file can set the host first.
// This file must not import ./setup: after vi.resetModules that would install a second default bridge.
import { afterEach, describe, expect, it } from 'vitest';

import type Alignment from '../app/store/Alignment';
import type AstralTree from '../app/store/AstralTree';
import type Run from '../app/store/Run';
import type { RendererBridge } from '../common/rendererBridge';

type RunParent = ConstructorParameters<typeof Run>[0];
type Variant = 'bare' | 'full' | 'alternate';

// The output name check resolves to the name it was asked for, and the app version is fixed.
export const pinBridge: Partial<RendererBridge> = {
  checkOutput: ( { outputDir, outputName } ) =>
    Promise.resolve( { outputDir, outputName, ok: true, notice: '', outputNameUnused: outputName, resultFilenames: [] } ),
  getVersion: () => Promise.resolve( '2.0.0' ),
};

export async function pinCommands( { windows }: { windows: boolean } ): Promise<void> {
  const { autorun, runInAction } = await import( 'mobx' );
  const { default: RunStore } = await import( '../app/store/Run' );
  const { analysisOptions, raxmlNgAnalysisOptions, binaries } = await import( '../app/store/RunOptions' );

  const file = ( ...parts: string[] ): string => ( windows
    ? `C:\\${parts.join( '\\' )}`
    : `/${parts.join( '/' )}` );
  const exe = ( name: string ): string => ( windows
    ? `${name}.exe`
    : name );
  // The binary list depends on the host's platform, arch and CPU count, and ASTRAL is commented out of it.
  // A binary the list lacks is added, so every pin runs on every machine.
  const binary = ( name: string, type: string, version: string ): string => {
    if ( !binaries.some( ( b ) => b.name === name ) ) {
      binaries.push( { name, type, version } );
    }
    return name;
  };
  const names = {
    raxml: binary( exe( 'raxmlHPC' ), 'raxml', '8.2.12' ),
    raxmlThreads: binary( exe( 'raxmlHPC-PTHREADS-SSE3' ), 'raxml', '8.2.12' ),
    raxmlNg: binary( exe( 'raxml-ng' ), 'raxml', '1.2.2' ),
    // No shipped RAxML-NG binary has PTHREADS in its name, so only this stand-in reaches the --threads branch.
    raxmlNgThreads: binary( exe( 'raxml-ng-PTHREADS' ), 'raxml', '1.2.2' ),
    modeltest: binary( exe( 'modeltest-ng' ), 'modeltest', '0.1.7' ),
    astral: binary( 'astral.5.7.8.jar', 'astral', '5.7.8' ),
  };

  const alignment = ( dataType = 'nucleotide', over: Record<string, unknown> = {} ): Alignment => ( {
    name: 'a',
    path: file( 'in', 'a.fasta' ),
    filename: 'a.fasta',
    dir: file( 'in' ),
    taxons: ['t1', 't2', 't3', 't4'],
    length: 10,
    dataType,
    hasInvariantSites: false,
    modeltestLoading: false,
    ngSubstitutionModelCmd: 'GTR+G',
    aaMatrixName: 'BLOSUM62',
    partition: { isDefault: true, isComplete: true },
    ...over,
  } as unknown as Alignment );

  const variants: Record<Variant, { alignments: () => Alignment[]; set: ( run: Run ) => void }> = {
    bare: {
      alignments: () => [alignment()],
      set: ( run ) => {
        run.disableCheckUndeterminedSequence = false;
      },
    },
    full: {
      alignments: () => [alignment()],
      set: ( run ) => {
        run.partitionFile = file( 'in', 'parts.txt' );
        run.outGroup.setValue( ['t1', 't2'] );
        run.useBackboneConstraint = true;
        run.useMultifurcatingConstraint = true;
        run.backboneConstraint.setFilePath( file( 'in', 'backbone.tre' ) );
        run.multifurcatingConstraint.setFilePath( file( 'in', 'multifurcating.tre' ) );
        run.branchLength.setValue( true );
        run.sHlike.setValue( true );
        run.startingTree.setValue( 'User defined' );
        run.tree.setFilePath( file( 'in', 'start.tre' ) );
        run.substitutionMatrix.setValue( 'HKY' );
        run.numRuns.setValue( 10 );
        run.numRepetitions.setValue( 200 );
        run.numRepetitionsNg.setValue( 'autoMRE' );
      },
    },
    alternate: {
      alignments: () => [alignment( 'multistate', { partition: { isDefault: false, isComplete: true } } )],
      set: ( run ) => {
        run.sHlike.setValue( true );
        run.multistateModel.setValue( 'MK' );
        run.substitutionAscertainment.setValue( "Lewis' method" );
      },
    },
  };

  const stops: ( () => void )[] = [];
  afterEach( () => {
    while ( stops.length ) {
      stops.pop()?.();
    }
  } );

  async function build(
    binaryName: string,
    analysis: string | undefined,
    alignments: Alignment[],
    set?: ( run: Run ) => void,
  ): Promise<Run> {
    const run = new RunStore( {} as RunParent, 1 );
    runInAction( () => {
      run.binary.value = binaryName;
      run.outputDir = file( 'out' );
      run.outputName = 'pin';
      run.alignments = alignments;
    } );
    // analysis is a computed that builds its option; keep it observed so a set value sticks.
    stops.push( autorun( () => run.analysis ) );
    // The output name check is async and only computes while observed.
    stops.push( autorun( () => run.outputNameAvailable.get() ) );
    runInAction( () => {
      if ( analysis ) {
        run.analysis.setValue( analysis );
      }
      run.setRandomSeed( 123 );
      run.numThreads.setValue( 3 );
      set?.( run );
    } );
    // Lets the output name check and the app version settle.
    await new Promise( ( resolve ) => setTimeout( resolve, 0 ) );
    return run;
  }

  // The output name only reads as settled inside a reaction.
  function read<T>( fn: () => T ): T {
    let value!: T;
    autorun( () => {
      value = fn();
    } )();
    return value;
  }

  const families = [
    { title: 'RAxML', options: analysisOptions, plain: names.raxml, threaded: names.raxmlThreads },
    { title: 'RAxML-NG', options: raxmlNgAnalysisOptions, plain: names.raxmlNg, threaded: names.raxmlNgThreads },
  ];
  for ( const { title, options, plain, threaded } of families ) {
    describe( `${title} args`, () => {
      for ( const { value } of options ) {
        for ( const variant of ['bare', 'full', 'alternate'] as const ) {
          it( `${value} ${variant}`, async () => {
            const { alignments, set } = variants[variant];
            const run = await build( variant === 'full'
              ? threaded
              : plain, value, alignments(), set );
            expect( read( () => run.args ) ).toMatchSnapshot();
          } );
        }
      }
    } );
  }

  describe( 'args, branches the three variants miss', () => {
    // The follow-up commands of fast tree search and ML search copy the first command's branches.
    it( 'RAxML FT alternate with branch lengths', async () => {
      const run = await build( names.raxml, 'FT', variants.alternate.alignments(), ( r ) => {
        variants.alternate.set( r );
        r.branchLength.setValue( true );
      } );
      expect( read( () => run.args ) ).toMatchSnapshot();
    } );

    it( 'RAxML FT with branch lengths and SH-like values on a default partition', async () => {
      const run = await build( names.raxml, 'FT', [alignment()], ( r ) => {
        r.branchLength.setValue( true );
        r.sHlike.setValue( true );
      } );
      expect( read( () => run.args ) ).toMatchSnapshot();
    } );

    it( 'RAxML ML with SH-like values on a default partition', async () => {
      const run = await build( names.raxml, 'ML', [alignment()], ( r ) => r.sHlike.setValue( true ) );
      expect( read( () => run.args ) ).toMatchSnapshot();
    } );

    // RAxML-NG ancestral states chooses its partition by "more than one alignment", not by a non-default partition.
    it( 'RAxML-NG AS with two alignments', async () => {
      const second = alignment( 'nucleotide', { path: file( 'in', 'b.fasta' ), filename: 'b.fasta' } );
      const run = await build( names.raxmlNg, 'AS', [alignment(), second] );
      expect( read( () => run.args ) ).toMatchSnapshot();
    } );
  } );

  // The empty default arm of each builder's switch.
  describe( 'args for an analysis the builder does not know', () => {
    for ( const [title, binaryName] of [['RAxML', names.raxml], ['RAxML-NG', names.raxmlNg]] ) {
      it( title, async () => {
        const run = await build( binaryName, 'unknown', [alignment()] );
        expect( read( () => run.args ) ).toMatchSnapshot();
      } );
    }
  } );

  describe( 'ModelTest-NG args', () => {
    for ( const dataType of ['nucleotide', 'protein', 'binary'] ) {
      it( dataType, async () => {
        const run = await build( names.modeltest, undefined, [alignment( dataType )] );
        expect( read( () => run.args ) ).toMatchSnapshot();
      } );
    }
  } );

  const withAstralTree = ( run: Run ): void => {
    run.astralTree = { path: file( 'in', 'genes.tre' ) } as AstralTree;
  };

  describe( 'ASTRAL args', () => {
    it( 'with a loaded tree', async () => {
      const run = await build( names.astral, undefined, [], withAstralTree );
      expect( read( () => run.args ) ).toMatchSnapshot();
    } );

    it( 'without a tree', async () => {
      const run = await build( names.astral, undefined, [] );
      expect( read( () => run.args ) ).toMatchSnapshot();
    } );
  } );

  describe( 'command and settings file', () => {
    const cases: [string, () => Promise<Run>][] = [
      // Thorough bootstrap is three commands, so the pin shows how they are joined.
      ['RAxML', () => build( names.raxmlThreads, 'ML+tBS', variants.full.alignments(), variants.full.set )],
      // The shipped binary: the full variant's stand-in name would be pinned into the command text.
      ['RAxML-NG', () => build( names.raxmlNg, 'ML+TBE+con', variants.full.alignments(), variants.full.set )],
      ['ModelTest-NG', () => build( names.modeltest, undefined, [alignment()] )],
      ['ASTRAL', () => build( names.astral, undefined, [], withAstralTree )],
    ];
    for ( const [title, make] of cases ) {
      it( title, async () => {
        const run = await make();
        expect( read( () => run.command ) ).toMatchSnapshot( 'command' );
        expect( read( () => run.settingsFileContent ) ).toMatchSnapshot( 'settingsFileContent' );
      } );
    }
  } );
}
