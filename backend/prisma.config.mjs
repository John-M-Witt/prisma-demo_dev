import path from 'node:path';  
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config'; 
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 

loadEnv({ path: path.join(__dirname, 'prisma', '.env') });

const fromHere = (...s) => path.join(__dirname, ...s);

export default defineConfig({
  schema: fromHere('prisma', 'schema.prisma'), 
  migrations: {
    path: fromHere('prisma', 'migrations'), 
    seed: `node ./prisma/seed.js`
  },
  typedSql: {
    path: fromHere('prisma', 'sql')
  }
});


/*
// Explanation of backend/prisma.config.mjs

// Import Node's built-in 'path' module for working with cross-platform file and directory paths
import path from 'node:path';  

//Converts an ESM file URL (import.meta.url) into a normal file path string
import { fileURLToPath } from 'node:url';

// Import Prisma's configuration helper function to define the prisma.config.mjs file
// Validates the structure and makes it future-proof for new Prisma config features
import { defineConfig } from 'prisma/config'; 

import { config as loadEnv } from 'dotenv';

//Convert the current module's URL (import.meta.url) to a filesystem path string
//file:///C:/Users/johnw/Documents/Code Development/projects_backend/prisma-demo_dev/prisma.config.mjs
//become c:\Users\johnw\Documents\Code Development\projects_backend\prisma-demo_dev\prisma.config.mjs
const __filename = fileURLToPath(import.meta.url); 

//Gets directory name from the full file path  (similar to __dirname in CommonJS)
//Result: c:\Users\johnw\Documents\Code Development\projects_backend\prisma-demo_dev\backend
const __dirname = path.dirname(__filename);

loadEnv({ path: path.join(__dirname, 'prisma', '.env') });

// Helper function to build absolute paths from the current directory (__dirname)
const fromHere = (...s) => path.join(__dirname, ...s);

export default defineConfig({
 
// SCHEMA FILE:
  // Absolute path to the Prisma schema file.
  // Prisma reads this file when running commands like:
  //   npx prisma generate  → generate @prisma/client
  //   npx prisma migrate dev  → apply migrations based on schema changes
  schema: fromHere('prisma', 'schema.prisma'), 

 // Absolute path to the folder where Prisma stores migration files.
    // Prisma writes here when you run:
    //   npx prisma migrate dev   → creates a timestamped migration folder with SQL
    //   npx prisma migrate deploy → applies all pending migrations  
  migrations: {
    path: fromHere('prisma', 'migrations'), 
  
   // SEED COMMAND:
    // Command Prisma runs when you execute:
    //   npx prisma db seed
    // It should point to a script that inserts initial data into your DB.
    // Prisma will:
    //   1. Load the schema
    //   2. Connect to the DB
    //   3. Run this seed command
    seed: `node ./prisma/seed.js`,
  
  // Configuration for the `typedSql` preview feature.
  typedSql: {
    path: fromHere('prisma', 'sql')
  },

 // initShadowDb: `...` // optional
  }
  // Optional extras not currently used:
  // views: { path: fromRoot('prisma', 'views') },
  // typedSql: { path: fromRoot('prisma', 'queries') },
  // tables: { external: [] },
  // enums: { external: [] },
});






*/