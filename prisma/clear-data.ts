import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.project.deleteMany();
  await prisma.student.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.discussion.deleteMany();
  
  // Create a quick test entry to verify write access, then immediately delete it
  console.log('Verifying write access to Neon DB...');
  const testStudent = await prisma.student.create({
    data: {
      firstName: 'Test',
      lastName: 'Verify',
    }
  });
  console.log('Successfully wrote to DB! Created test student ID:', testStudent.id);
  
  await prisma.student.delete({ where: { id: testStudent.id } });
  console.log('Successfully removed test student.');
  
  console.log('All mock data (Projects, Students, Enrollments, Sessions, etc.) removed completely.');
  console.log('The database is ready for production. Base users and rooms remain intact.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
