interface DebugInfoInput {
  name: string;
  version: string;
  electron: string;
  platform: string;
  arch: string;
  release: string;
  locale: string;
}

export function debugInfo( {
  name,
  version,
  electron,
  platform,
  arch,
  release,
  locale,
}: DebugInfoInput ): string {
  return `${name} ${version}
Electron ${electron}
${platform} ${arch} ${release}
Locale: ${locale}`;
}
