// A CLI argument: seeds and thread counts are pushed as numbers.
export type CmdArg = string | number;

// Shaped like the second argument `quote` takes.
export interface Platform {
  windows: boolean;
}

export const commandText = ( binary: string, args: CmdArg[][], usesAstral: boolean ): string => {
  if ( usesAstral ) {
    return args
      .map( ( cmdArgs ) => `java -jar ${binary} ${cmdArgs.join( ' ' )}` )
      .join( ' &&\\\n' );
  }
  return args
    .map( ( cmdArgs ) => `${binary} ${cmdArgs.join( ' ' )}` )
    .join( ' &&\\\n' );
};

export const settingsText = ( { appVersion, analysisTitle, binary, outputDir, args }: {
  appVersion: string | undefined;
  analysisTitle: string;
  binary: { value: string; version: string | undefined };
  outputDir: string;
  args: CmdArg[][];
} ): string => {
  let text = `The analysis was run using raxmlGUI 2.0 (version ${appVersion}) as follows:
Analysis: ${analysisTitle}
Binary: ${binary.value} version ${binary.version}
Results saved to: ${outputDir}
`;
  let argumentext = 'RAxML was called with these arguments:\n';
  args.map(
    ( arg, index ) => ( argumentext += `${index + 1}.) ${arg.join( ' ' )}\n` ),
  );
  text += argumentext;
  // TODO: should we be more precise about what the single params mean?
  //     text += `To repeat the analysis use the following seeds:
  // Bootstrap seed: ${this.seedBootstrap}
  // Parsimony seed: ${this.seedParsimony}`;
  return text;
};
