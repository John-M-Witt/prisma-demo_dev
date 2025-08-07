import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
 

const prisma = new PrismaClient();

// Create a new user
async function createUser (name, email) {
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        created_at: new Date()
      },
    });
    console.log(`User created: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally{
    await prisma.$disconnect();
  }
}

// Read all users
async function findAllUsers () {
    try {
        const users = await prisma.user.findMany();
        console.log('All users:', users);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
} 
// Delete a user by email
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
async function addPost (title, content, published, author_id, topic_id) {
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
    catch(error) {
      console.error(`Error creating post: ${error}`);  
    } finally {
        await prisma.$disconnect();
    }
}

async function usersByDateRange (startDate, EndDate) {
    try {
        const usersByDate = await prisma.user.findMany({
        where: {
            AND: [
                {created_at: {gte: new Date(startDate),} },
                {created_at: {lte: new Date(EndDate)} },
            ]
        }
        })
       if(usersByDate.length === 0) {
        console.log(`Date range from ${startDate} to ${EndDate} returned no users.`)
       } else {
        console.log(usersByDate);
       } 
    }
    catch(error) {
        console.error('Error retrieving records', error)
    }
}

// usersByDateRange('2025-08-01', '2025-08-31');

//Returns published posts after a specified date
async function publishedPostsAuthorCommentsSinceDate (date) {
    try {
        const posts = await prisma.post.findMany({
            where: {
                AND: [
                    {published: true},
                    {created_at: {gte: new Date(date)} },
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
    } catch(error) {
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
    const authors   = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: { id: true, name: true, city: true },
    })

    // 3️⃣Build a lookup map from the authors array
    const authorMap = new Map(authors.map(user => [user.id, user]))

    // 4) Merge counts with author info
    const topAuthors = publishedCounts.map(r => {
      const author = authorMap.get(r.author_id)   // now defined
      return {
        id:             r.author_id,
        name:           author ? author.name : null,
        city:           author ? author.city : null,
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