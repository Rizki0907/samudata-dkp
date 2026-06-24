const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Deleting all PerikananTangkap data...');
    const result = await prisma.perikananTangkap.deleteMany({});
    console.log(`Deleted ${result.count} rows.`);
}
main().finally(() => prisma.$disconnect());
