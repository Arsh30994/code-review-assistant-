// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed an admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      role: Role.ADMIN,
    },
  });
  console.log('Seeded user:', admin.email);

  // Seed a default OpenAI provider
  const provider = await prisma.aIProvider.upsert({
    where: { name: 'OpenAI GPT-4o' },
    update: {},
    create: {
      name: 'OpenAI GPT-4o',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY ?? '',
      isActive: true,
    },
  });
  console.log('Seeded provider:', provider.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
