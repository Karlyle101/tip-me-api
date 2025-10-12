import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a demo barista
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'barista@example.com' },
    update: {},
    create: {
      email: 'barista@example.com',
      passwordHash,
      name: 'Demo Barista',
      role: 'BARISTA',
      handle: 'demo-barista'
    }
  });

  // Create an admin user
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('adminpassword123', 10),
      name: 'Admin',
      role: 'ADMIN',
      handle: 'admin'
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
