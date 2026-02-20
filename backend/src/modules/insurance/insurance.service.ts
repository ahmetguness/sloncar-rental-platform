import { PrismaClient, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export const insuranceService = {
    checkInsuranceExpiries: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tenDaysFromNow = new Date(today);
        tenDaysFromNow.setDate(today.getDate() + 10);

        // Find insurances expiring in 10 days or exactly today
        // Marking them as adminRead = false gives them a notification badge

        const expiringIn10Days = await prisma.userInsurance.updateMany({
            where: {
                endDate: {
                    gte: tenDaysFromNow,
                    lt: new Date(tenDaysFromNow.getTime() + 24 * 60 * 60 * 1000)
                },
                adminRead: true
            },
            data: {
                adminRead: false
            }
        });

        const expiredToday = await prisma.userInsurance.updateMany({
            where: {
                endDate: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                },
                adminRead: true
            },
            data: {
                adminRead: false
            }
        });

        if (expiringIn10Days.count > 0 || expiredToday.count > 0) {
            console.log(`[CRON] Detected ${expiringIn10Days.count} insurances expiring in 10 days, ${expiredToday.count} expiring today.`);
        }
    },
    getAllInsurances: async (params: {
        page?: number;
        limit?: number;
        searchTerm?: string;
    }) => {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.UserInsuranceWhereInput = {};

        if (params.searchTerm) {
            where.OR = [
                { policyNumber: { contains: params.searchTerm, mode: 'insensitive' } },
                { companyName: { contains: params.searchTerm, mode: 'insensitive' } },
                { user: { email: { contains: params.searchTerm, mode: 'insensitive' } } },
                { user: { name: { contains: params.searchTerm, mode: 'insensitive' } } },
            ];
        }

        const [total, insurances] = await Promise.all([
            prisma.userInsurance.count({ where }),
            prisma.userInsurance.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            data: insurances,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    createInsurance: async (data: Prisma.UserInsuranceCreateInput) => {
        return prisma.userInsurance.create({
            data: {
                ...data,
                adminRead: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    },

    deleteInsurance: async (id: string) => {
        return prisma.userInsurance.delete({
            where: { id },
        });
    },

    exportInsurances: async () => {
        const insurances = await prisma.userInsurance.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sigortalar');

        worksheet.columns = [
            { header: 'Kullanıcı Adı', key: 'userName', width: 20 },
            { header: 'E-posta', key: 'userEmail', width: 25 },
            { header: 'Telefon', key: 'userPhone', width: 15 },
            { header: 'Sigorta Şirketi', key: 'companyName', width: 20 },
            { header: 'Poliçe No', key: 'policyNumber', width: 15 },
            { header: 'Poliçe Tipi', key: 'policyType', width: 15 },
            { header: 'Prim Tutarı', key: 'premiumAmount', width: 15 },
            { header: 'Teminat Limiti', key: 'coverageLimit', width: 15 },
            { header: 'Başlangıç', key: 'startDate', width: 15 },
            { header: 'Bitiş', key: 'endDate', width: 15 },
            { header: 'Acente', key: 'agentName', width: 20 },
            { header: 'Durum', key: 'status', width: 10 },
        ];

        insurances.forEach((ins: any) => {
            worksheet.addRow({
                userName: ins.user?.name || '-',
                userEmail: ins.user?.email || '-',
                userPhone: ins.user?.phone || '-',
                companyName: ins.companyName,
                policyNumber: ins.policyNumber,
                policyType: ins.policyType || '-',
                premiumAmount: ins.premiumAmount,
                coverageLimit: ins.coverageLimit,
                startDate: new Date(ins.startDate).toLocaleDateString('tr-TR'),
                endDate: new Date(ins.endDate).toLocaleDateString('tr-TR'),
                agentName: ins.agentName || '-',
                status: ins.isActive ? 'Aktif' : 'Pasif',
            });
        });

        return workbook;
    },
};
