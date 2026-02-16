import { PrismaClient, Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export const insuranceService = {
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
            data,
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
