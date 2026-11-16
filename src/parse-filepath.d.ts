declare module 'parse-filepath' {
  interface ParsedPath {
    name: string;
    base: string;
    dir: string;
    ext: string;
    path: string;
  }
  export default function parsePath( filePath: string ): ParsedPath;
}
