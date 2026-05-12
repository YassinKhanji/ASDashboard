import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing DB connection...');
  
  // Count users before
  const usersBefore = await prisma.user.count();
  console.log(`Users before deletion: ${usersBefore}`);

  // Delete all users with role INSTRUCTOR
  const result = await prisma.user.deleteMany({
    where: {
      role: 'INSTRUCTOR',
    },
  });
  
  console.log(`Deleted ${result.count} instructors from the database.`);
  
  // Count users after
  const usersAfter = await prisma.user.count();
  console.log(`Users after deletion: ${usersAfter}`);
  
  console.log('Database connection verified and cleanup complete.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
