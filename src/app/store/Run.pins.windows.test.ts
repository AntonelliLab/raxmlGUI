// Command pins on a Windows host with paths like C:\out.
import { vi } from 'vitest';

import { pinBridge, pinCommands } from '../../test/commandPins';
import { installBridge } from '../../test/setup';

installBridge( {
  ...pinBridge,
  host: { windows: true, release: '10.0.19045', arch: 'x64', cpuModel: 'Intel' },
} );
// Run.ts and RunOptions.ts read the host once at import, so the store loads again after the host is set.
vi.resetModules();

await pinCommands( { windows: true } );
