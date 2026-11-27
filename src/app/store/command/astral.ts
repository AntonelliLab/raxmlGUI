import { join, quote } from '../../paths';
import type { Platform } from './index';

export interface AstralInput {
  outputDir: string;
  outputNameSafe: string;
  astralTree: { path: string } | null | undefined;
}

export const astralArgs = ( run: AstralInput, { windows }: Platform ): string[][] => {
  const first: string[] = [];
  if ( run.astralTree ) {
    first.push( '-i', quote( run.astralTree.path, { windows } ) );
  }
  first.push(
    '-o',
    quote( join( run.outputDir, `ASTRAL_${run.outputNameSafe}.tre` ), { windows } ),
  );
  return [first];
};
