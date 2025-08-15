// backend/db/prismaClient.js

// Load path utilities
import path from 'node:path';

// Load URL-to-path converter
import { fileURLToPath } from 'node:url';

// Load .env support
import dotenv from 'dotenv';

import { PrismaClient } from '@prisma/client';

// Convert the current file URL to a real file path. Resolve backend/db → backend → backend/prisma/.env

// Get absolute URL of prismaClient.js - C:\Users\johnw\Documents\Code Development\projects_backend\prisma-demo_dev\backend\db\prismaClient.js
const __filename = fileURLToPath(import.meta.url);  

//Get absolute directory of prismaClient.js - C:\Users\johnw\Documents\Code Development\projects_backend\prisma-demo_dev\backend\db
const __dirname = path.dirname(__filename);         

//'..' moves up one directory to backend folder and adds prisma folder, yielding C:\Users\johnw\Documents\CodeDevelopment\projects_backend\prisma-demo_dev\backend\prisma\.env
const envPath = path.join(__dirname, '..', 'prisma', '.env');  

// Load the env file explicitly. 
dotenv.config({ path: envPath });

// Instantiate PrismaClient and configure it to emit events for every query
export const prisma = new PrismaClient({
  // Emit a 'query' event whenever Prisma executes a SQL statement
  log: [{ emit: 'event', level: 'query' }]
});

// Register an event listener for Prisma query events
prisma.$on('query', (e) => {
  // e.query contains the raw SQL that was run. 
  // $1, $2, etc. are PostgreSQL-style bind‐parameter placeholders. Replace with actual values to run in pg Admin4
  console.log('📝 Prisma SQL:', e.query);
  // e.duration is the time in milliseconds the query took
  console.log('⏱️ Duration:', e.duration, 'ms');
})

// Create a new user
async function createUser(name, email) {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        city,
        created_at: new Date()
      },
    });
    console.log(`User created: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Read all users
async function findAllUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('All users:', users);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// findAllUsers();

// Delete user by email
async function deleteUserByEmail(email) {
  try {
    const user = await prisma.user.delete({
      where: { email },
    });
    console.log(`User deleted: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

//Update existing user email   
async function updateUserEmail(oldEmail, newEmail) {
  try {
    const user = await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail },
    });
    console.log(`User updated: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}
//Create a post
async function addPost(title, content, published, author_id, topic_id) {
  try {
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        published,
        author_id,
        topic_id,
      },
    });
    console.log(`Post created: ${newPost}`);
  }
  catch (error) {
    console.error(`Error creating post: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function newUsersByDateRange(startDate, EndDate) {
  try {
    const usersByDate = await prisma.user.findMany({
      where: {
        AND: [
          { created_at: { gte: new Date(startDate), } },
          { created_at: { lte: new Date(EndDate) } },
        ]
      }
    })
    if (usersByDate.length === 0) {
      console.log(`Date range from ${startDate} to ${EndDate} returned no users.`)
    } else {
      console.log(usersByDate);
    }
  }
  catch (error) {
    console.error('Error retrieving records', error)
  }
}

// newUsersByDateRange('2025-08-01', '2025-08-31');

//Returns published posts after a specified date
async function publishedPostsAuthorCommentsSinceDate(startDate) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          { created_at: { gte: new Date(startDate) } },
          { published: true }
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            city: true,
          }
        },
        comments: {
          select: {
            content: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    // Maps each post, replacing the comments array of objects with an array of strings
    const postsViewableComments = posts.map(post => ({
      ...post,
      comments: post.comments.map(c => c.content),
    }));

    console.log('Posts with authors and comments', postsViewableComments);
  } catch (error) {
    console.error('Error fetch posts', error);
  } finally {
    await prisma.$disconnect();
  }
}
// publishedPostsAuthorCommentsSinceDate('2025-08-01');

//Returns top five authors based on the total number of published posts

async function topFiveAuthorsByPublishedCount() {
  try {
    // 1️⃣ Group & count only published posts per author
    const publishedCounts = await prisma.post.groupBy({
      by: ['author_id'],
      where: { published: true },          // only published posts
      _count: { author_id: true },         // count posts per author
      orderBy: { _count: { author_id: 'desc' } }, // highest counts first
      take: 5,                             // limit to top 5
    });

    // 2️⃣ Fetch those authors’ details, leveraging the from User model table
    const authorIds = publishedCounts.map(r => r.author_id);
    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, city: true },
    })

    // 3️⃣Build a lookup map from the authors array
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
    })

    console.log('Top 5 authors by published post count:', topAuthors)
  } catch (e) {
    console.error('Error retrieving top authors:', e)
  } finally {
    await prisma.$disconnect()
  }
}

topFiveAuthorsByPublishedCount();

//All users authored at least 5 published posts, count of their posts and most recent post

//Option 1

async function getActiveUsersWithRecentPosts() {
  try {
    const users = await prisma.user.findMany({
      where: {
        posts: {
          some: { published: true }
        }
      },
      include: {
        _count: {             //Total published posts by User id, including those less than 5
          select: {
            posts: true
          }
        },
        posts: {
          where: {
            published: true,
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1,
          select: {
            content: true,
            created_at: true
          }
        }
      }
    })
    const result = users
      .filter(user => user._count.posts >= 5) //Removes users with < 5 posts
      .map(activeUser => ({                   //Maps remaining users to desired fields
        id: activeUser.id,
        name: activeUser.name,
        totalPosts: activeUser._count.posts,
        LatestPost: activeUser.posts[0]
        })
      )

console.log(result);
} catch (error) {
  console.log(error);
} finally {
  await prisma.$disconnect();
}
}

// getActiveUsersWithRecentPosts();

//Option 2 - More efficient approach

async function getActiveUsersWithRecentPosts_v2 () {
  try {
    const activeUsers = await prisma.post.groupBy({
      by: ['author_id'],
      where: {published: true},
      _count: {author_id: true},
      _max: {created_at: true}, 
      having: {
        author_id:{
          _count: {
            gte: 5
          }
        }
      },
      orderBy: {
        _count: {
            id: 'desc'
        }}
    })
    if (!activeUsers || activeUsers.length === 0) {
      console.log('No active users found');
      return [];
    }
    
  const activeUsersPost = await Promise.all(
    activeUsers.map(async (authorStats) => {
    const userRecord = await prisma.user.findUnique({
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
  console.log(activeUsersPost);
  } catch(error){
    console.log(error);
  } finally {
      await prisma.$disconnect();
  }
}

// getActiveUsersWithRecentPosts_v2();

//
async function searchPostsContent (keyword) {
  try {
    const matchingPosts = await prisma.$queryRaw`
      SELECT * 
      FROM "posts"
      WHERE "content" % ${keyword}
    `;

    if (!matchingPosts || matchingPosts.length === 0) {
      console.log('No matching posts found.')
    } else {
      console.log(`Posts matching the ${keyword} keyword:`, matchingPosts)
    } 
  } 
  catch (error) {
    console.log(`Error retrieving matching posts`);
  } finally {
    await prisma.$disconnect();
  }
}
  
searchPostsContent('incedent');



