const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function migrateAndStart() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated successfully!');
    
    // Run database migrations
    console.log('🗄️ Running database migrations...');
    await execAsync('npx prisma migrate deploy');
    console.log('✅ Database migrations completed successfully!');
    
    // Start the application
    console.log('🚀 Starting the application...');
    require('./dist/server.js');
    
  } catch (error) {
    console.error('❌ Error during migration or startup:', error);
    process.exit(1);
  }
}

migrateAndStart();