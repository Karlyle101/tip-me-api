const { spawn } = require('child_process');

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function migrateAndStart() {
  try {
    console.log('🚀 Starting Tip Me API...');
    
    // Run database migrations
    console.log('🗄️ Running database migrations...');
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);
    console.log('✅ Database migrations completed!');
    
    // Start the application
    console.log('🚀 Starting the server...');
    require('./dist/server.js');
    
  } catch (error) {
    console.error('❌ Error during startup:', error);
    console.log('⚠️  Trying to start without migration...');
    // Try to start anyway in case migrations aren't needed
    require('./dist/server.js');
  }
}

migrateAndStart();
