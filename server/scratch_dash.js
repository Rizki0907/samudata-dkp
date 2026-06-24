const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const budidayaStats = await prisma.budidaya.aggregate({
      _sum: { produksi_ton: true },
      _count: { id: true }
    });

    const budidaya = {
      produksi: budidayaStats._sum.produksi_ton || 0, // Dalam Ton
      pembudidaya: budidayaStats._count.id || 0 // Asumsi jumlah titik/laporan
    };
    console.log(budidaya);
}
main().finally(() => prisma.$disconnect());
