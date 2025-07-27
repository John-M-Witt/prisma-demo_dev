import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to create a new user
async function createUser (name, email) {
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        created_at: new Date(),
      },
    });
    console.log(`User created: ${user.name} (${user.email})`);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally{
    await prisma.$disconnect();
  }
}

// createUser( 'John Smith', 'johnsmith@google.com');

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
// findAllUsers();

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
// deleteUserByEmail('teri.smith+17@example.com');

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
updateUserEmail('johnsmith@google.com','john.smith@google.com');

