# Coding standards

## Test doubles

A double stays when `dispose`, a constructor, or an imported package calls it. Trace those calls before reporting the double unused.

## Source scans

A source scan shows a send is guarded when the return sits on the path from the last await to that send.

## Serialized errors

A page helper that cleans a bridge error reads a string `stack` field. It does not require `instanceof Error`.

## Main-process Node globals

A main-process production file keeps bare Node globals such as `setImmediate`. A test that needs that global under jsdom polyfills it in that test file. Do not put Node `setImmediate` on the shared Jest setup: React's scheduler prefers it and races jsdom teardown.
