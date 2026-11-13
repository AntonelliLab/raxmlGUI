export function debugInfo( { name, version, electron, platform, release, locale } ) {
  return `${name} ${version}
Electron ${electron}
${platform} ${release}
Locale: ${locale}`;
}
