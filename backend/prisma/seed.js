/*
Executing seed.js script 
npx prisma db seed: Runs the seed file from the folder with package.json (e.g. ".../backend") 
npx prisma migrate reset: Drops every table, recreates them from scratch and re-seeds based on seed.js
*/

import {PrismaClient} from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
const totalUsers = 500;

async function seedUsers() {
  console.log('🌱 Starting user seed...');

  const userData = Array.from({ length: totalUsers }).map((_, i) => {
    
    const fullName = faker.person.fullName();
    const baseEmail = fullName
    .toLowerCase()
    .replace(/\s+/g,'.')              // Replace spaces with dots
    .replace(/[^a-z0-9.]/g, '');       // Remove other invalid characters
    
    return {
      email: `${baseEmail}+${i}@example.com`, // Ensure unique email for each user
      name: fullName,
      city: faker.location.city(),
      created_at: faker.date.past(),
    }
  });

   if(userData.length === totalUsers) {
    console.log(`✅ Prepared ${userData.length} user records for seeding`);
   } else {
      console.warn(`⚠️ Warning: Expected 500 user records, but only received ${userData.length}`); 
   }
  // Sort by creation_date ascending prior to DB insertion. Function .getTime() returns the number of milliseconds since January 1, 1970, 00:00:00 UTC.
  userData.sort((a, b) => a.created_at.getTime() - b.created_at.getTime()); 
  console.log('🔄 Inserting users into the database...');

  const result = await prisma.user.createMany({
    data: userData,
    skipDuplicates: true, // Skip duplicates if any 
  });

  console.log(`✅ Inserted ${result.count} users`);
}

seedUsers()
.catch(e => {
  console.error('❌ Error seeding users:', e);
    process.exit(1);
})
.finally(async () => {
  await prisma.$disconnect();
});