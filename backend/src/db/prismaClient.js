// backend/src/db/prismaClient.js
// Purpose: export a single shared PrismaClient instance for the process.
// Do NOT load dotenv here — let the caller (scripts/entrypoint) load env first.

import { PrismaClient } from '@prisma/client';

// Use a unique key on globalThis to avoid accidental name collisions.
// This stores the client across module reloads (useful in dev with HMR)
const GLOBAL_KEY = '__learn_prisma_prisma_client__';

// Grab the global object reference
const globalWithPrisma = globalThis;

// If an instance already exists on the global object, reuse it.
// Otherwise create a new PrismaClient instance. We use the nullish operator (??)
// so that falsy-but-valid values (0, '', false) won't trigger creation — only
// undefined/null do.
const prisma = globalWithPrisma[GLOBAL_KEY] ?? new PrismaClient({
  // Optional: enable query event logging in development. This config only
  // registers event emission; we add the listener below.
  log: [{ emit: 'event', level: 'query' }]
});

// Store the instance back on globalThis so subsequent imports reuse it.
globalWithPrisma[GLOBAL_KEY] = prisma;

// Register any event listeners on the concrete instance.
// This is safe because `prisma` is already defined above.
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    // Keep logs lightweight — this helps during learning whether queries run.
    // In production you might omit or guard these logs further.
    console.log('📝 Prisma query:', e.query);
    console.log('⏱ Duration (ms):', e.duration);
  });
}

// Export the shared client for other modules to import
export { prisma };
