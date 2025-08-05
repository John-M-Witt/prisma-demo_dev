import { PrismaClient } from '@prisma/client/index';
import { useImperativeHandle } from 'react';

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
      console.log(`Error creating post: ${error}`);  
    } finally {
        await prisma.$disconnect();
    }
}
// addPost('My second post', 'This is the content of my second post.', true, '42af36d4-6c1f-4020-aa9d-b088a61fa3b1');

async function usersByDateRange (startDate, EndDate) {
    try {
        const usersByDate = await prisma.findMany({
        where: {
            AND: [
                {created_at: {gte: startDate,}},
                {created_at: {lte: EndDate}},
            ]
        }
        })
       if(usersByDate.length === 0) {
        console.log(`Date range from ${startDate} to ${EndDate} returned no users.`)
       } 
    }
    catch(error) {
        console.log('Error retrieving records', error)
    }
}
