// backend/src/scripts/run-comments.js
//
// CLI for comment-related operations.
// Usage examples (from backend folder):
//   node src/scripts/run-comments.js list --limit=5 
//   node src/scripts/run-comments.js add --post_id=<post-uuid> --author_id=<user-uuid> --content="Hello"
//   node src/scripts/run-comments.js delete --id=<comment-uuid>
//  OR 
//   npm run query:comments list
//   npm run query:comments add --post_id=<postId> --author_id=<authorId> --content="text"
//   npm run query:comments delete --id=<commentId>

// Notes:
// - This file dynamically imports prismaClient and the service AFTER loadEnvOnce()
//   so PrismaClient is constructed with a proper DATABASE_URL.
// - The script maps domain errors to exit codes but prints friendly messages.

import { loadEnvOnce } from '../db/loadEnvOnce.js';

loadEnvOnce(); // must run before importing prismaClient


// Minimal robust arg parser supporting:
//  --key=value  --key value  -k value  --flag
function parseArgs(rawArgs) {
  const args = {};
  const tokens = Array.from(rawArgs); // copy
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith('--')) {
      // --long or --long=value
      if (t.includes('=')) {
        const [k, ...rest] = t.slice(2).split(/=(.+)/);
        args[k] = stripQuotes(rest.join('='));
      } else {
        const key = t.slice(2);
        const next = tokens[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
          args[key] = stripQuotes(next);
          i++;
        } else {
          args[key] = true;
        }
      }
    } else if (t.startsWith('-') && t.length === 2) {
      // -k style (single-letter)
      const key = t.slice(1);
      const next = tokens[i + 1];
      if (next !== undefined && !next.startsWith('-')) {
        args[key] = stripQuotes(next);
        i++;
      } else {
        args[key] = true;
      }
    } else {
      // positional or stray token: push into _positional array
      args._positional = args._positional || [];
      args._positional.push(stripQuotes(t));
    }
  }
  return args;
}

function stripQuotes(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}

function printHelp() {
  console.log(`
Usage:
  node src/scripts/run-comments.js list [--limit=10] OR 
  .../backend/npm run query:comments -- list
  node src/scripts/run-comments.js add --post_id=<postId> --author_id=<authorId> --content="text" OR 
    .../backend/npm run query:comments -- add --post_id=<postId> --author_id=<authorId> --content="text"
  node src/scripts/run-comments.js delete --id=<commentId> OR 
  .../backend/npm run query:comments -- delete --id=<commentId>

Examples:
  node src/scripts/run-comments.js list --limit=5
  node src/scripts/run-comments.js add --post_id=abc123 --author_id=def456 --content="Hello world"
  node src/scripts/run-comments.js delete --id=xyz789
`);
}

// Main IIFE
(async () => {
  // dynamic imports after loadEnvOnce() so prisma sees DATABASE_URL
  const { prisma } = await import('../db/prismaClient.js');

  //Extract functions and domain error classes
  const {getLatestComments, addComment, removeComment, BadRequestError, NotFoundError, ConflictError, ServiceError } = await import('../services/comments.service.js');

// Defensive export checks for debugging any missing exports
  if (typeof getLatestComments !== 'function' ||
      typeof addComment !== 'function' ||
      typeof removeComment !== 'function') {
    console.error('One or more required functions are not exported from comments.service.js');
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const argv = process.argv.slice(2);
  const cmd = argv[0] || 'list';
  const raw = argv.slice(1);
  const opts = parseArgs(raw);

  // Aliases and helpers
  const getLimit = () => {
    const l = opts.limit ?? opts.l ?? 10;
    const parsed = Number(l);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.trunc(parsed))) : 10;
  };

  const getContent = () => opts.content ?? opts.c ?? opts._positional?.[0] ?? '';
  const getPostId = () => opts.post_id ?? opts.post ?? opts.p ?? opts.postId ?? '';
  const getAuthorId = () => opts.author_id ?? opts.author ?? opts.a ?? opts.authorId ?? '';
  const getId = () => opts.id ?? opts.i ?? opts._positional?.[0] ?? '';

  try {
    if (cmd === 'list') {
      const limit = getLimit();
      const rows = await getLatestComments(limit);
      console.log(`Found ${rows.length} comment(s) (limit ${limit}):`);
      console.table(rows);
      process.exitCode = 0;
    } else if (cmd === 'add') {
      const content = getContent();
      const post_id = getPostId();
      const author_id = getAuthorId();

      if (!content || !post_id || !author_id) {
        console.error('Missing required fields for add. Required: --content, --post_id, --author_id');
        printHelp();
        process.exitCode = 2;
        return;
      }

      // Build payload according to your service expectation
      const payload = { content, post_id, author_id };

      const created = await addComment(payload);
      console.log('Created comment:');
      console.dir(created, { depth: 2 });
      process.exitCode = 0;
    } else if (cmd === 'delete') {
      const id = getId();
      if (!id) {
        console.error('Missing required --id for delete');
        printHelp();
        process.exitCode = 2;
        return;
      }
      const deleted = await removeComment(id);
      console.log('Deleted comment:');
      console.dir(deleted, { depth: 2 });
      process.exitCode = 0;
    } else if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
      printHelp();
      process.exitCode = 0;
    } else {
      console.error('Unknown command:', cmd);
      printHelp();
      process.exitCode = 2;
    }
  } catch (err) {
    // Domain-aware error handling
    if (err instanceof BadRequestError) {
      console.error('Bad request:', err.message);
      process.exitCode = 2;
    } else if (err instanceof ConflictError) {
      console.error('Conflict:', err.message);
      process.exitCode = 3;
    } else if (err instanceof NotFoundError) {
      console.error('Not found:', err.message);
      process.exitCode = 4;
    } else if (err instanceof ServiceError) {
      console.error('Service error:', err.message);
      process.exitCode = 1;
    } else {
      // Unexpected
      console.error('Script error:', err);
      process.exitCode = 1;
    }
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // If disconnect fails, log and exit non-zero
      console.error('Error disconnecting Prisma:', e);
      process.exitCode = process.exitCode || 1;
    }
  }
})();
