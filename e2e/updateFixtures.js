// Runs the ModelTest spec against the real app in update mode. Never run by test:e2e.
const { spawnSync } = require('child_process');
const path = require('path');

const result = spawnSync(
  process.execPath,
  [
    path.join(__dirname, '..', 'node_modules', 'playwright', 'cli.js'),
    'test',
    '--config',
    path.join(__dirname, 'playwright.config.js'),
    'modeltest-outcome.spec.js',
  ],
  { stdio: 'inherit', env: { ...process.env, RAXMLGUI_UPDATE_FIXTURES: '1' } },
);
process.exit(result.status ?? 1);
