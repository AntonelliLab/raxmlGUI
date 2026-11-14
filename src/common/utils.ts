interface Is {
  macos: boolean;
  linux: boolean;
  windows: boolean;
  development: boolean;
}

export const is: Is = {
  macos: process.platform === 'darwin',
  linux: process.platform === 'linux',
  windows: process.platform === 'win32',
  development: process.env.NODE_ENV === 'development',
};

export const platform = <T>(
  object: { [key: string]: T | ( () => T ) | undefined },
): T => {
  let platformKey: string = process.platform;
  if ( is.macos ) {
    platformKey = 'macos';
  } else if ( is.windows ) {
    platformKey = 'windows';
  }
  const fn = platformKey in object
    ? object[platformKey]
    : object.default;
  return typeof fn === 'function'
    ? ( fn as () => T )()
    : fn as T;
};

export const quote = ( dir: string ): string => ( is.windows
  ? `"${dir}"`
  : dir );
