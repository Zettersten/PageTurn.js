import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const require = createRequire(import.meta.url);

// Ensure the setup file executes before Vitest bootstraps
await import(pathToFileURL(require.resolve('./vitest.setup.js')));

const child = spawn('npx', ['vitest', 'run'], {
  stdio: 'inherit',
  env: { ...process.env }
});

await new Promise((resolve, reject) => {
  child.on('exit', code => {
    if (code === 0) resolve();
    else reject(new Error(`Vitest exited with code ${code ?? 'null'}`));
  });
  child.on('error', reject);
});
