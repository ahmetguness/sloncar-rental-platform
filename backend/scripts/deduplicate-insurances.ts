import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findDuplicates() {
    console.log('--- Sigorta Mükerrer Kayıt Analizi ---');

    const insurances = await prisma.insurance.findMany();
    console.log(`Toplam kayıt sayısı: ${insurances.length}`);

    const groups = new Map<string, string[]>();

    for (const ins of insurances) {
        // Determine uniqueness based on key fields (TC + Name + Branch + Plate + Amount)
        // We ignore the policyNo if it was a temporary one
        const key = `${ins.tcNo}-${ins.fullName}-${ins.branch}-${ins.plate || 'NO_PLATE'}-${ins.amount.toString()}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(ins.id);
    }

    let totalDupes = 0;
    let groupsWithDupes = 0;

    for (const [key, ids] of groups.entries()) {
        if (ids.length > 1) {
            groupsWithDupes++;
            totalDupes += (ids.length - 1);
            // console.log(`Grup [${key}]: ${ids.length} adet kayıt bulundu.`);
        }
    }

    console.log(`Tekrar eden grup sayısı: ${groupsWithDupes}`);
    console.log(`Silinebilecek toplam mükerrer kayıt sayısı: ${totalDupes}`);

    return { totalDupes, groups };
}

async function cleanDuplicates() {
    const { totalDupes, groups } = await findDuplicates();
    if (totalDupes === 0) {
        console.log('Temizlenecek mükerrer kayıt bulunmadı.');
        return;
    }

    console.log(`${totalDupes} kayıt siliniyor...`);

    let deletedCount = 0;
    for (const [key, ids] of groups.entries()) {
        if (ids.length > 1) {
            // Keep the first one, delete the rest
            const toDelete = ids.slice(1);
            await prisma.insurance.deleteMany({
                where: {
                    id: { in: toDelete }
                }
            });
            deletedCount += toDelete.length;
        }
    }

    console.log(`Başarıyla ${deletedCount} mükerrer kayıt silindi.`);
}

cleanDuplicates()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
