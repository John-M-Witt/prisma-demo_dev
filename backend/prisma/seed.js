/*
Executing seed.js script 
npx prisma db seed: Runs the seed file from the folder with package.json (e.g. ".../backend") 
npx prisma migrate reset: Drops every table, recreates them from scratch and re-seeds based on seed.js
*/

import {PrismaClient} from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
const totalUsers = 500;
const totalTopics = 50;

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

// seedUsers()
// .catch(e => {
//   console.error('❌ Error seeding users:', e);
//     process.exit(1);
// })
// .finally(async () => {
//   await prisma.$disconnect();
// });

async function seedTopics() {
  console.log('🌱 Seeding 50 topics…')

  // 1️⃣ Generate 50 unique music artist names (3 words each)
  const artistNames = faker.helpers.uniqueArray(
    () => faker.music.artist(),
    totalTopics
  );

  // 2️⃣ Build your data array
  const topicsData = artistNames.map(artist => ({
    name: artist,
    description: faker.lorem.sentence(),
  }))

  // 3️⃣ Insert them in one batch, skipping any duplicates
  const result = await prisma.topic.createMany({
    data: topicsData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${result.count} topics`)
}

// seedTopics()
//   .catch(e => {
//     console.error('❌ Error seeding topics:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   })

//Data to seed Posts table
const authorIds = [
  "bb0a924f-b4a4-469f-bde2-9a0b3f5dcec6",
  "666ae718-a940-4ac3-a028-f9bf173ffe52",
  "318fceac-d69e-4c24-b8cc-272d453bbcac",
  "f9e7f0c9-c8d7-4e5f-bf3e-4afccd69d5a9",
  "bd05b2ca-9fcb-4d20-8fd9-de14cd9af136",
  "9b7242bc-3d56-431d-8189-2add776b2a0c",
  "af203b36-0384-44f7-9119-c879caf08d52",
  "7978af0b-f402-4ab3-ae11-889ac014095a",
  "0d670aec-317c-4c18-a978-790ad723bc37",
  "ac5c52d3-e097-4df5-be34-b48f6fce8cd6",
  "6c21a721-d8d1-44bc-be5b-515b383b8770",
  "430cc8cf-fcd8-40d4-88c8-910f9e8fe5ce",
  "8aaf0ad6-398e-400d-8a04-ca46d3a38fff",
  "5ec0e414-5931-438a-a644-70fc79cf7c89",
  "15215085-f886-4c22-bedf-cac5ccb9454e",
  "77af1059-9b39-4db1-b90c-45c9c2d0a010",
  "d760c9e3-7143-4b23-bea7-607e1d9c452f",
  "d0478676-d95d-42ba-a892-54bbccdd35a6",
  "29d633fe-b1ae-4800-8f38-b6d9492b9d58",
  "5695c41a-b31c-4a67-9a24-6191b7871848" 
]

const topicIds = [
"7da8fbf5-2da3-4977-b4ff-8e3443cb3f3a",
"dbdffba3-8300-40ed-ab8b-36af7b689816",
"1c24cad4-128e-49a8-ae31-e91b56eafc69",
"c642fdb5-215a-4146-a5ac-db0be28bf07f",
"4c3386a9-d6c3-4151-9461-ad3db639e4aa",
"76fcfbf1-ef35-4ac3-86bd-11e959998eed",
"e5104f5a-1755-4e50-92ee-31d3705f3158",
"bd72eff2-0231-458c-8f61-cb5078ab6f5c",
"c819e0f4-920a-4ca6-be4b-8ed3eff6156a",
"78eae133-d8d3-4a89-832b-8ee6aa8bba98",
"b8b305f2-ad09-4d9e-adda-370c1e0dc49c",
"bf659b65-48a1-4b18-8f72-af8970e59a4d",
"1f56be86-ec12-4c24-8ef9-ccb98c3b6c69",
"f9f6f9e1-42a4-4b35-84c3-4a783007d30e",
"7f336b18-698a-4141-8234-d56b2372a2aa",
"fd2d05e6-170a-4079-8227-e211b7abb1bc",
"059fc299-606a-4f83-aaf7-44137eefd1ea",
"998fe920-3f4c-49b6-9810-67ce92a95c88",
"d26d9db6-f733-40b8-90ea-d962e63d1c04",
"a3509cea-7b27-4ef4-a1d3-cdc27e4dfeb0"
]

async function seedPosts() {
  console.log('🌱 Seeding 20 posts…')

  const postsData = Array.from({ length: 20 }).map(() => ({
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    published: faker.datatype.boolean(),
    author_id: faker.helpers.arrayElement(authorIds),
    topic_id:  faker.helpers.arrayElement(topicIds),
  }))

  const result = await prisma.post.createMany({
    data: postsData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${result.count} posts`)
}

// seedPosts()
//   .catch(e => {
//     console.error('❌ Error seeding posts:', e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })


const postIds = [
"65bcd388-5092-43ec-bf68-5da19ccc51d6",
"b9b15452-eefa-4b6a-a2e8-c7f0fc1a4c42",
"2d819364-c111-482a-9d47-b959b011d4fb",
"a2928e07-cc78-465c-be26-8fbf3693fcf2",
"cf14b1be-3bc6-41cd-ac5a-48df5459dba7",
"59738be9-e756-4e20-aadd-4ecdcd41bf1e",
"a72f0537-2531-403e-b828-b968af029c4c",
"f3e63042-0fbf-4fb6-be07-d13d70f40f81",
"825c6213-eba5-4581-88a8-83ada6aebc88",
"c0508c1e-773b-4c6d-afff-314b50e62af1",
"79326ea3-2a26-4a6e-8a4c-4276f3053843",
"b4870bab-fd2b-4d0c-8d5d-a4fbdb13ef15",
"e90348d6-55cf-43a2-b460-7725169a2182",
"910f5334-2541-4a41-97a1-d17e4c3bb267",
"e8fa462b-02c8-4cd8-86aa-cca295fd608e",
"4af8684c-1d50-4ef7-aa2f-6573dc5c29c5",
"03081ad4-deae-47fc-8a52-19dc78f88672",
"71051b0d-1e82-45f4-ab2b-ec632d001750",
"75aaa45d-3630-4cb2-a92a-0b0861e2b10c",
"24ec49de-6e50-4e2e-9f9e-fda027c8e002"
]


async function seedComments() {
  console.log('🌱 Seeding 20 comments…')

  const commentsData = Array.from({ length: 20 }).map(() => ({
    content: faker.lorem.sentences(2),
    post_id: faker.helpers.arrayElement(postIds),
    author_id: faker.helpers.arrayElement(authorIds),
  }))

  const result = await prisma.comment.createMany({
    data: commentsData,
    skipDuplicates: true,
  })

  console.log(`✅ Created ${result.count} comments`)
}

// seedComments()
//   .catch(e => {
//     console.error('❌ Error seeding comments:', e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })
