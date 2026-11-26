/** Known binary stdout messages that name a cause the user can fix. */
const userFixMessages: [RegExp, ( match: RegExpMatchArray ) => string][] = [
  [
    /The file (.+?) RAxML wants to open for writing or appending can not be opened/,
    ( m ) => `RAxML could not write to the output file '${m[1]}'. Check that the output folder is writable and that the file is not open in another program.`,
  ],
  [
    /Taxon Name too long at taxon (\d+),[\s\S]*?current setting (\d+)/,
    ( m ) => `RAxML rejected the alignment: the name of taxon ${m[1]} is too long (the limit is ${m[2]} characters). Shorten the taxon names and run again.`,
  ],
  [
    /Bad base \((.+?)\) at site (\d+) of sequence (\d+)/,
    ( m ) => `RAxML rejected the alignment: bad base (${m[1]}) at site ${m[2]} of sequence ${m[3]}. Remove or replace that character and run again.`,
  ],
  [
    /TOO FEW SPECIES|Your alignment contains less than 4 sequences/,
    () => 'RAxML rejected the alignment: it contains fewer than 4 sequences. Add sequences and run again.',
  ],
  [
    /must be used in the order they are available, i\.e\.\s*([^\r\n]+?)\s*You are using the following characters:\s*([^\r\n]+?)\s*(?:\r?\n|$)/,
    ( m ) => `RAxML rejected the alignment: multistate characters must be used in the order they are available (${m[1]}), but the alignment uses ${m[2]}. Recode the states to start at 0 and run again.`,
  ],
  [
    /Error loading MSA: cannot parse any format supported by RAxML-NG/,
    () => 'RAxML-NG rejected the alignment: Error loading MSA: cannot parse any format supported by RAxML-NG. Check that the file is a valid alignment in FASTA, PHYLIP or another supported format.',
  ],
];

/** The user-fix message for a failed run's stdout, or undefined when no known cause matches. */
export function userFixMessage( stdout: string ): string | undefined {
  for ( const [pattern, message] of userFixMessages ) {
    const match = stdout.match( pattern );
    if ( match ) {
      return message( match );
    }
  }
  return undefined;
}
