// backend/src/services/comments.service.js
// Business / domain layer for "comments".
// - Validates and sanitizes input
// - Checks existence of related records (post, author)
// - Calls the repo (DB) functions to perform writes/reads
// - Translates common Prisma errors into domain errors

import * as repo from '../db/queries/comments/comments.repo.js';
import { prisma } from '../db/prismaClient.js'; // used for existence checks and transactions

// Domain error types so callers can react appropriately
export class BadRequestError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ServiceError extends Error {}

/**
 * Return the latest comments (thin wrapper so caching/metrics later can be added later).
 * @param {number} limit number of comments to return (default 10)
 * @returns {Promise<Array>} array of comment objects
 */
export async function getLatestComments(limit = 10) {
 const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    throw new Error('limit must be a number');
  }
  const effective = Math.max(1, Math.min(100, Math.trunc(parsed)));
  return repo.findLatestComments(effective);}

/**
 * Add a comment to a post.
 * Accepts an input object and returns the created comment (including any includes repo returns).
 *
 * Expected input shape (example): { content, post_id, author_id }
 */
const toCleanString = (value) => (value == null ? '' : String(value)).trim();

export async function addComment(input) {
  // --- 1. Basic validation & sanitization (whitelist)
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

  // --- 2. Existence checks (friendly error messages)
  // Quick parallel existence checks to avoid foreign-key errors and provide clear messages.
  const [post, author] = await Promise.all([
    prisma.post.findUnique({ where: { id: post_id }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: author_id }, select: { id: true } })
  ]);

  if (!post) throw new NotFoundError(`Post ${post_id} not found`);
  if (!author) throw new NotFoundError(`Author ${author_id} not found`);

  // --- 3. Build payload (whitelist only allowed fields)
  const payload = {
    content,
    post_id,
    author_id
  };

  // --- 4. Create and translate common DB errors
  try {
    // Use repo to create the comment (repo returns the created comment)
    const created = await repo.addCommentToPost(payload);
    return created;
  } catch (err) {
    // Prisma foreign-key failure (rare now because we checked existence)
    if (err?.code === 'P2003') {
      throw new ServiceError('Foreign key constraint failed');
    }
    // Unique constraint, etc. (example)
    if (err?.code === 'P2002') {
      throw new ConflictError('Unique constraint violation');
    }
    // Unexpected: wrap in ServiceError to avoid leaking DB internals to callers
    throw new ServiceError(err?.message ?? String(err));
  }
}

/**
 * Remove a comment by id.
 * Returns the deleted comment record (Prisma's delete will throw if the record doesn't exist).
 * If you prefer idempotent delete, use deleteMany in repo and return the count.
 */
export async function removeComment(id) {
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new BadRequestError('id is required to delete a comment');
  }

  try {
    const deleted = await repo.deleteCommentById(id);
    return deleted;
  } catch (err) {
    // Prisma throws P2025 when the record to delete does not exist
    if (err?.code === 'P2025' || /record to delete does not exist/i.test(String(err?.message ?? ''))) {
      throw new NotFoundError(`Comment ${id} not found`);
    }
    throw new ServiceError(err?.message ?? String(err));
  }
}
