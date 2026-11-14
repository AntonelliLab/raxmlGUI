interface DebugInfoInput {
  name: string;
  version: string;
  electron: string;
  platform: string;
  release: string;
  locale: string;
}

export function debugInfo( {
  name,
  version,
  electron,
  platform,
  release,
  locale,
}: DebugInfoInput ): string {
  return `${name} ${version}
Electron ${electron}
${platform} ${release}
Locale: ${locale}`;
}
