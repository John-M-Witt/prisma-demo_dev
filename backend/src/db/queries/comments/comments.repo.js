// prisma + raw sql queries for comments
//backend/src/db/comments/comments.repo.js

import {prisma} from '../../prismaClient.js'; 

const MAX_LIMIT = 50; // repo-level safety cap (set lower in service level)

/**
 * Repo: get latest comments from published posts.
 * Expects service to validate / supply a default for `limit`.
 * If a finite limit is provided, it will be clamped to [1, MAX_LIMIT].
 * Accepts optional `client` for transactional usage (default: global prisma).
 */

export function getLatestComments (limit, client = prisma) {
  const parsed = Math.trunc(Number(limit)); // NaN if invalid
  const hasFiniteLimit = Number.isFinite(parsed);  
   // only compute `take` when the parsed value is a finite number
  const take = hasFiniteLimit ? Math.max(1, Math.min(parsed, MAX_LIMIT)) : undefined; 

  const opts = {
    where: {
        post: {
          is: {published: true} // relation filter for to-one relation
        }
      },
      orderBy: { created_at: 'desc' },
      ...(take !== undefined ? {take} : {}),
      select: {
        id: true,
        content: true,
        created_at: true,
        post: {
          select: {
            id: true,
            title: true, 
            content: true,
            published: true
          }
        },
        author: {
          select: {
            id: true,
            name: true
          }
        }
        }
  }
  return client.comment.findMany(opts);
}

/**
 * Add a comment to a post.
 * - payload: { content, post_id, author_id }
 * - accepts optional client (tx) for transactional usage
 */
export function addCommentToPost(payload, client = prisma) {
//Required data object properties: content, post_id, author_id 
  return client.comment.create({data: payload});
}

/**
 * Delete comment by id.
 * - Accepts optional client (tx).
 */
export function deleteCommentById (commentId, client = prisma) {
  return client.comment.delete({
    where: {
      id: commentId
    }
  });
}
