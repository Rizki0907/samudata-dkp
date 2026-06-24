const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.budidaya.count();
  console.log('Budidaya row count:', count);
}
main().finally(() => prisma.$disconnect());
