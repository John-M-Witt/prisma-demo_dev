// backend/src/services/comments.service.js
// Business / domain layer for "comments".
// - Validates and sanitizes input
// - Checks existence of related records (post, author)
// - Calls the commentsRepo (DB) functions to perform writes/reads
// - Translates common Prisma errors into domain errors

import * as commentsRepo from '../db/queries/comments/index.js';
import { prisma } from '../db/prismaClient.js'; // used for existence checks and transactions
import { Prisma } from '@prisma/client'; // used to narrow Prisma errors
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Domain error types so callers can react appropriately
export class BadRequestError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ServiceError extends Error {}

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} content
 * @property {string} authorId
 * @property {string} postId
 * @property {string} created_at
 */

/**
 * Return the latest comments (thin wrapper so caching/metrics later can be added later).
 * @param {number} [limit=10] Number of comments to return (default 10)
 * @returns {Promise<Array<object>>} array of comment objects
 */
export async function getLatestComments(limit = 10) {
 const parsed = Math.trunc(Number(limit));
  if (!Number.isFinite(parsed)) {
    throw new BadRequestError('limit must be a number');
  }
  const effectiveLimit = Math.max(1, Math.min(100, Math.trunc(parsed)));

   // Service layer uses await and will translate DB errors if needed
  try {
    return await commentsRepo.getLatestComments(effectiveLimit);
  } catch (err) {
    console.error('getLatestComments: unexpected DB error', err);
    throw new ServiceError('Unable to fetch latest comments');
  }
}

// Sanitize helper
const toCleanString = (value) => (value == null ? '' : String(value)).trim();

/**
 * Add a comment to a post.
 * Accepts an input object and returns the created comment (including any includes commentsRepo returns).
 *
 * Expected input shape (example): { content, post_id, author_id }
 */
export async function addComment(input) {
  // --- 1. Basic validation & sanitization
  const content = toCleanString(input.content);
  const post_id = toCleanString(input.post_id);
  const author_id = toCleanString(input.author_id); 

  if (!content) {
    throw new BadRequestError('content is required');
  }

  if (!post_id) {
    throw new BadRequestError('post_id is required');
  }

  if (!author_id) {
    throw new BadRequestError('author_id is required');
  }

  const payload = {
    content,
    post_id,
    author_id
  };

  // --- 2. Run existence checks + create atomically in a transaction
  try {
    // Use tx for reads & writes to avoid races
    const created = await prisma.$transaction(async (tx) => {

    // Existence checks: perform inside transaction to avoid races
    const [post, author] = await Promise.all([
      tx.post.findUnique({ where: { id: post_id }, select: { id: true } }),
      tx.user.findUnique({ where: { id: author_id }, select: { id: true } })
    ]);

    if (!post) {
      // Throwing here aborts the transaction and causes the outer catch to handle mapping
      throw new NotFoundError(`Post ${post_id} not found`);
    }
    if (!author) {
      throw new NotFoundError(`Author ${author_id} not found`)
    };
    // Create the comment using the transactional client
    return commentsRepo.addCommentToPost(payload, tx);
    });

    return created;
  
  } catch (rawErr) {
    // Re-throw domain errors that originated inside the transaction
    if (rawErr instanceof BadRequestError || rawErr instanceof NotFoundError) {
      console.warn('Domain error in addComment transaction', { payload, err: rawErr });
      throw rawErr
    }
     // Narrow Prisma known-request errors before inspecting codes
    if (rawErr instanceof Prisma.PrismaClientKnownRequestError) {
        // Foreign key failure (unlikely due to existence checks inside tx)
      if (rawErr.code === 'P2003'){
        console.error('Prisma P2003 (FK) error while adding comment', { payload, meta: rawErr.meta});
        throw new ServiceError('Foreign key constraint failed');
      }
      // Unique constraint violation
      if (rawErr.code === 'P2002') {
        const target = rawErr.meta?.target;
        const fields = Array.isArray(target) ? target.join(',') : target;
        throw new ConflictError(`Duplicate value for fields: ${fields ?? 'unknown'}`);
      } 
    }
    // Unexpected: log context and wrap
    console.error('addComment: unexpected error', { payload, err: rawErr });
    throw new ServiceError('Unable to add comment');}
}

/**
 * Remove a comment by id.
 * Returns the deleted comment record (Prisma's delete will throw if the record doesn't exist).
 * If you prefer idempotent delete, use deleteMany in commentsRepo and return the count.
 */
export async function removeComment(id) {
  const idClean = toCleanString(id)
  if (!idClean) {
    throw new BadRequestError('id is required to delete a comment');
  }

  try {
    const deleted = await commentsRepo.deleteCommentById(id);
    return deleted;
  } catch (err) {
    if(err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new NotFoundError(`Comment ${id} not found`); 
    }
    console.error('removeComment: unexpected error', err)
    throw new ServiceError('Unable to delete comment');
    }
  }

