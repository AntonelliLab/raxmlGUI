// Command pins on the host the test setup installs: not Windows, paths like /out.
import { pinBridge, pinCommands } from '../../test/commandPins';
import { installBridge } from '../../test/setup';

installBridge( pinBridge );

await pinCommands( { windows: false } );
