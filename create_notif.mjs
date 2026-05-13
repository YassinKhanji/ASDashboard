import { PrismaClient } from '@prisma/client';

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
      title: 'Sample Notification',
      content: 'This is a test notification. Try clicking it on mobile!',
      link: '/projets',
    }
  });
  console.log('Notification created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
