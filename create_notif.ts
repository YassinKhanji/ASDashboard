import { PrismaClient } from './src/lib/prisma.ts';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }
  
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Project approved',
      content: 'Your project "Summer Halakas" has been approved.',
      link: '/projets',
    }
  });
  console.log('Notification created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
