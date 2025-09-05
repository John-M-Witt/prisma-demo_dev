// prisma + raw sql queries for comments
//backend/src/db/comments/comments.repo.js

import {prisma} from '../../prismaClient.js'; 

export function findLatestComments (limit = 10) {
    return prisma.comment.findMany({
      where: {
        post: { published: true }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        post: {
          select: {
            title: true, 
            content: true
          }
        },
        author: {
          select: {
            name: true
          }
        },
        content: true
        }
    });
}

export function addCommentToPost(data) {
//Required data object properties: content, post_id, author_id 
  return prisma.comment.create({data});
}

export function deleteCommentById (commentId) {
  return prisma.comment.delete({
    where: {
      id: commentId
    }
  });
}
