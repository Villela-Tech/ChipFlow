import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  try {
    // Criar usuário admin
    const hashedPassword = await hashPassword('admin123');
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@chipflow.com' },
      update: {},
      create: {
        email: 'admin@chipflow.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('Admin user created:', admin);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 