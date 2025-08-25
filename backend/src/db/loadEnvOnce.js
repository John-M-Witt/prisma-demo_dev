// backend/src/db/loadEnvOnce.js
// Load environment variables from backend/prisma/.env in a way that is
// independent of the process current working directory (process.cwd()).
// This uses the module file location (import.meta.url) to compute the path.

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Convert the current ESM module URL to a filesystem path and get its directory.
// e.g. since this file is at .../backend/src/db/loadEnvOnce.js then:
// __filename -> .../backend/src/db/loadEnvOnce.js
// __dirname  -> .../backend/src/db/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build the path to backend/prisma/.env relative to this file.
// From src/db -> go up two levels to backend, then into prisma/.env
const envPath = path.join(__dirname, '..', '..', 'prisma', '.env');

let loaded = false;

/**
 * Loads the .env file at backend/prisma/.env once per process.
 * Safe to call from multiple modules — it will only load on the first call.
 */
export function loadEnvOnce() {
  if (loaded) return;
  dotenv.config({ path: envPath });
  loaded = true;
}

/**
 * Optional: export the resolved path for diagnostics or tests:
 * import { envPath } from './loadEnvOnce.js';
 */
export { envPath };
