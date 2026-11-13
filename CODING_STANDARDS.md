# Coding standards

## ipc constants

An `ipc` export names a live channel the preload or main handler uses. A log label that is not a channel is a string literal in the call. `src/ipcLive.test.js` fails when an export has no use in `src/preload` or `src/main`.

## Main asks

A criterion that names main-process behavior is not done when only the preload and a proof exercise the channel. Look for a production caller in `src/main` (for state report: `getActiveState` sending `STATE_REPORT`).

## Test doubles

A double stays when `dispose`, a constructor, or an imported package calls it. Trace those calls before reporting the double unused.

## Source scans

A source scan shows a send is guarded when the return sits on the path from the last await to that send.

## Serialized errors

A page helper that cleans a bridge error reads a string `stack` field. It does not require `instanceof Error`.

## Main-process Node globals

A main-process production file keeps bare Node globals such as `setImmediate`. A test that needs that global under jsdom polyfills it in that test file. Do not put Node `setImmediate` on the shared Jest setup: React's scheduler prefers it and races jsdom teardown.
