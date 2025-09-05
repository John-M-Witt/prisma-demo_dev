import {prisma} from '../../prismaClient.js'; 


// Create a new user
export async function createUser(name, email) {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        city,
        created_at: new Date()
      },
    });
}

// Read all users
export async function findAllUsers() {
    const users = await prisma.user.findMany();
}

// Delete user by email
export async function deleteUserByEmail(email) {
  const user = await prisma.user.delete({
    where: { email },
    });
}

//Update existing user email   
export async function updateUserEmail(oldEmail, newEmail) {
  const user = await prisma.user.update({
    where: { email: oldEmail },
    data: { email: newEmail },
    });
}

//Create a post
export async function addPost(title, content, published, author_id, topic_id) {
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        published,
        author_id,
        topic_id,
      },
    });
}

export async function newUsersByDateRange(startDate, EndDate) {
  const usersByDate = await prisma.user.findMany({
    where: {
      AND: [
        { created_at: { gte: new Date(startDate), } },
        { created_at: { lte: new Date(EndDate) } },
      ]
    }
  })
}


//Returns published posts after a specified date
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


//Returns top five authors based on the total number of published posts
export async function topFiveAuthorsByPublishedCount() {
  // 1) Group & count only published posts per author
  const publishedCounts = await prisma.post.groupBy({
  by: ['author_id'],
    where: { published: true },          // only published posts
    _count: { author_id: true },         // count posts per author
    orderBy: { _count: { author_id: 'desc' } }, // highest counts first
    take: 5,                             // limit to top 5
  });

  // 2) Fetch those authors’ details, leveraging the from User model table
  const authorIds = publishedCounts.map(r => r.author_id);
  const authors = await prisma.user.findMany({
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
}

//All users authored at least 5 published posts, count of their posts and most recent post

//Option 1

export async function getActiveUsersWithRecentPosts() {
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
  });
const result = users
  .filter(user => user._count.posts >= 5) //Removes users with < 5 posts
  .map(activeUser => ({                   //Maps remaining users to desired fields
    id: activeUser.id,
    name: activeUser.name,
    totalPosts: activeUser._count.posts,
    LatestPost: activeUser.posts[0]
    })
  )
}

//Option 2 - More efficient approach

export async function getActiveUsersWithRecentPosts_v2 () {
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
      }
    }
  });

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
  );
}

export async function searchPostsContent (keyword) {
  const matchingPosts = await prisma.$queryRaw`
    SELECT * 
    FROM "posts"
    WHERE "content" % ${keyword}
    `;
}
    
  