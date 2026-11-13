import store from './store';
import { join } from './paths';

interface AlignmentExampleFilesPayload {
  fasta: string[];
  phylip: string[];
  dir: string;
  outdir: string;
}

interface AlignmentPathRef { path: string }

const e2e = typeof window !== 'undefined'
  && new URLSearchParams( window.location.search ).get( 'e2e' ) === '1';

if ( process.env.NODE_ENV === 'development' || e2e ) {
  console.log( '\n========= Bootstrapping initial state... =========\n' );
  const { rendererBridge } = window as unknown as {
    rendererBridge: {
      getExampleFiles: () => Promise<AlignmentExampleFilesPayload>;
    };
  };
  void rendererBridge.getExampleFiles().then( initDev );
}

function initDev( exampleFiles: AlignmentExampleFilesPayload ): void {
  // if (exampleFiles.length === 0) {
  //   return;
  // }
  const exampleFilesDir = exampleFiles.dir;
  // const useFiles = exampleFiles.filter(file => exampleFilenames.includes(file.name));
  const useFastaFiles: AlignmentPathRef[] = [
    // 'aminoacid.txt',
    // 'bin1.txt',
    // 'bin2.txt',
    // 'binary.txt',
    // 'dna.txt',
    // 'mixed_data.txt',
    // 'multistate.txt',
    'nucleotide.txt',
  ].map( ( filename ) => ( {
    path: join( exampleFilesDir, 'fasta', filename ),
  } ) );
  const usePhylipFiles: AlignmentPathRef[] = [
    // 'AA.txt',
    // 'align_allvariant.txt',
    // 'aminoacid.txt',
    // 'binary.txt',
    // 'dna_interleaved_relaxed.txt',
    // 'dna_interleaved.txt',
    // 'dna_sequential_relaxed.txt',
    // 'dna_sequential.txt',
    // 'mixed_data.txt',
    // 'multistate.txt',
    // 'nucleotide.txt',
    // 'fail_duplicate_taxon.txt',
    // 'fail_bad_base_at_site.txt',
    // 'fail_bad_name.txt',
    // 'test_invariant_sites.txt',
    // 'test_lower_case_bases.txt',
  ].map( ( filename ) => ( {
    path: join( exampleFilesDir, 'phylip', filename ),
  } ) );
  const useFiles = [].concat( useFastaFiles, usePhylipFiles );
  store.activeRun.addAlignments( useFiles );
  store.activeRun.setOutputDir( exampleFiles.outdir );
  setTimeout( () => {
    // store.activeRun.alignments[0].setShowPartition();
    // store.citation.show();
  }, 1000 );
}
