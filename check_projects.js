const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    where: { title: { in: ['Halakas 2026', 'Courses 2026'] } },
    select: { id: true, title: true, status: true, sessionPatternsJson: true, startDate: true, endDate: true, roomId: true }
  });
  console.log(JSON.stringify(projects, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
