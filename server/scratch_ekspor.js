const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.ekspor.count();
    console.log('Ekspor count:', count);
}
main().finally(() => prisma.$disconnect());
