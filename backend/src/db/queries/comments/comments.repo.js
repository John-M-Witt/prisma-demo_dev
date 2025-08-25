// prisma + raw sql queries for comments

import {prisma} from '../../prismaClient.js'; 

// Load path utilities
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env support
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);  
const __dirname = path.dirname(__filename);         // C:\Users\johnw\Documents\Code Development\projects_backend\prisma-demo_dev\backend\src\db\queries\comments\comments.repo.js

const envPath = path.join(__dirname, '..', 'prisma', '.env');  
dotenv.config({ path: envPath });


async function getTenLatestComments () {
  try {
    const comments = await prisma.comment.findMany({
      include: {
        title: true, 
        name: true,
        content: true
      },
      orderBy: {
        created_at: 'desc'
      },
      comment: {
        take: 10
      }
    })
  }
catch (error) {
  console.log(error);
  } finally {
  prisma.$disconnect();
  } 
}

getTenLatestComments();
