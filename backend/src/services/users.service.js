/** backend/src/services/users.service.js
 * Business / domain layer for "users".
 * Validates and sanitizes input
 * Checks existence of related records (email)
 * Calls the repo (DB) functions to perform writes/reads
 * Translates common Prisma errors into domain errors
*/

import * as usersRepo from "../db/queries/posts/posts.repo";
/** usersRepo functions
 * createUser,
 * findUsersByCity,
 * deleteUserByEmail, 
 * updateUserEmail,
 * newUsersByDateRange,
 * topFiveUsersByPublishedCount, 
 * getActiveUsersStats 
*/

import prisma from '../db/prismaClient';

// Domain error types so callers can react appropriately
export class BadRequestError extends Error {}
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ServiceError extends Error {}

const toCleanString = (value) => (value == null ? '' : String(value)).trim();
const toCleanNumber = (value) => Number.isFinite(value) ? Number(value).Math.trunc() : NaN;

export async function createNewUser (input) {
    // --- 1. Basic validation & sanitization (whitelist)
    const email = toCleanString(input.email);
    const name = toCleanString(input.name);
    const city = toCleanString(input.city);

    if (!email) {
        throw new BadRequestError('email is required.');
    }
    
    if (!name) {
        throw new BadRequestError('name is required');
    }

    if (!city) {
        throw new BadRequestError('city is required');
    }

// --- 2. Existence checks (friendly error messages)
// Quick parallel existence checks to avoid foreign-key errors and provide clear messages.

const emailExists = await prisma.user.findUnique({
    where: {
        newUserEmail: email,
        select: {email: true}
    }
}) 
if(emailExists) throw new ConflictError('email address already exists');

//  --- 3. Build payload (whitelist only allowed fields)
  const payload = {
    email,
    name,
    city
  };

// --- 4. Create and translate common DB errors
try {
    const newUser = await usersRepo.createUser({data: payload});
    return newUser;
} catch (err) {
    //unique constraint violation
    if (err?.code === 'P2002') {
       throw new ConflictError('Unique constraint violation'); 
    }
    // Unexpected: wrap in ServiceError to avoid leaking DB internals to callers
        throw new ServiceError(err?.message ?? String(err));
  }   
}

export async function usersByCity (cityName, limit = 10) {
// --- 1. Basic validation & sanitization (whitelist)
    const city =  toCleanString(cityName);
    if (!city) {
        throw new BadRequestError('city is required to search for users by city');
    }
    if (toCleanNumber(limit)) {
        throw new Error('limit must be a number');
  }
    const users = await findUsersByCity(city, parsed);
    return users;   
}

// topAuthorsByPublishedCount steps 2-4



// 2) Fetch those authors’ details, leveraging the from User model table
    const authorIds = publishedCounts.map(r => r.author_id);
    const authors = prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, city: true },
    })

    // 3) Build a lookup map from the authors array
    const authorMap = new Map(authors.map(user => [user.id, user]))

    // 4) Merge counts with author info
    const topAuthors = publishedCounts.map(r => {
      const author = authorMap.get(r.author_id)   // now defined
      return {
        id: r.author_id,
        name: author ? author.name : null,
        city: author ? author.city : null,
        publishedPosts: r._count.author_id,
      }
    });

export function activeUserStats (minPublished = 5) {



}

const activeUsersPost = Promise.all(
    activeUsers.map(async (authorStats) => {
    const userRecord = prisma.user.findUnique({
      where: {
        id: authorStats.author_id
      },
      include: {
        posts:  {
          where: {
            created_at: authorStats._max.created_at,
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1,
          select: {
           content: true,
           created_at: true
          },
        },
      },
    })
    
    return {
      authorId: userRecord.id,
      authorName: userRecord.name,
      totalPosts: authorStats._count.author_id,
      latestPost: userRecord.posts[0].content,
      latestPostDate: authorStats._max.created_at
    }
    })
  )
}