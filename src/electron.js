const electron = require('electron');
const proc = require('child_process');

// spawn Electron
const child = proc.spawn(electron, process.argv.slice(2), { stdio: 'inherit' });

child.on('close', (code) => {
  console.log(`Electron child process exited with code ${code}`);
});
