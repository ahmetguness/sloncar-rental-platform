import { PrismaClient, Prisma, InsuranceBranch } from '@prisma/client';
import ExcelJS from 'exceljs';
import stream from 'stream';
import { ApiError } from '../../middlewares/errorHandler.js';

const prisma = new PrismaClient();

// A helper dictionary to map Turkish headers to our DTO/prisma model
const COLUMN_MAP: Record<string, keyof Prisma.InsuranceCreateInput> = {
    'AY': 'month',
    'BAŞLANGIÇ TARİHİ': 'startDate',
    'TC': 'tcNo',
    'İSİM / SOYİSİM': 'fullName',
    'MESLEK': 'profession',
    'CEP': 'phone',
    'PLAKA': 'plate',
    'SERİ NO / SIRA NO': 'serialOrOrderNo',
    'TL': 'amount',
    'BRANŞ': 'branch',
    'ŞİRKET': 'company',
    'POLİÇE NO': 'policyNo',
    'AÇIKLAMA': 'description',
} as any;

const TURKISH_MONTHS = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];

/**
 * Generates Turkish-aware case variations for a search query (i/İ, ı/I).
 */
const getSearchVariations = (query: string): string[] => {
    if (!query) return [];
    const variations = new Set<string>([query]);

    // Standard variations
    variations.add(query.toLowerCase());
    variations.add(query.toUpperCase());

    // Turkish specific normalization
    const trLower = query.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    const trUpper = query.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();

    variations.add(trLower);
    variations.add(trUpper);

    // Mix (common typos or partial case conversions)
    variations.add(query.replace(/i/g, 'İ'));
    variations.add(query.replace(/İ/g, 'i'));
    variations.add(query.replace(/ı/g, 'I'));
    variations.add(query.replace(/I/g, 'ı'));

    return Array.from(variations);
};

export const insuranceService = {
    checkInsuranceExpiries: async () => {
        // Find insurances expiring in 10 days or exactly today based on 1-year policy rules
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tenDaysFromNow = new Date(today);
        tenDaysFromNow.setDate(today.getDate() + 10);

        // A policy expiring in 10 days means it was created exactly 1 year before tenDaysFromNow
        const tenDaysFromNowMinus1Year = new Date(tenDaysFromNow);
        tenDaysFromNowMinus1Year.setFullYear(tenDaysFromNow.getFullYear() - 1);

        const todayMinus1Year = new Date(today);
        todayMinus1Year.setFullYear(today.getFullYear() - 1);

        const expiringIn10Days = await prisma.insurance.updateMany({
            where: {
                startDate: {
                    gte: tenDaysFromNowMinus1Year,
                    lt: new Date(tenDaysFromNowMinus1Year.getTime() + 24 * 60 * 60 * 1000)
                },
                adminRead: true
            },
            data: { adminRead: false }
        });

        const expiredToday = await prisma.insurance.updateMany({
            where: {
                startDate: {
                    gte: todayMinus1Year,
                    lt: new Date(todayMinus1Year.getTime() + 24 * 60 * 60 * 1000)
                },
                adminRead: true
            },
            data: { adminRead: false }
        });

        if (expiringIn10Days.count > 0 || expiredToday.count > 0) {
            console.log(`[CRON] Detected ${expiringIn10Days.count} insurances expiring in 10 days, ${expiredToday.count} expiring today.`);
        }
    },
    getAllInsurances: async (params: {
        page?: number;
        limit?: number;
        searchTerm?: string;
        status?: string;
    }) => {
        const page = Number(params.page) || 1;
        const limit = Number(params.limit) || 10;
        const skip = (page - 1) * limit;

        const where: Prisma.InsuranceWhereInput = {};

        if (params.searchTerm) {
            const queryVariations = getSearchVariations(params.searchTerm);
            where.OR = [
                ...queryVariations.map(v => ({ fullName: { contains: v, mode: 'insensitive' as const } })),
                { tcNo: { contains: params.searchTerm, mode: 'insensitive' } },
            ];
        }

        // Status Filtering
        if (params.status) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const oneYearAgo = new Date(today);
            oneYearAgo.setFullYear(today.getFullYear() - 1);

            const oneYearAgoPlus10 = new Date(oneYearAgo);
            oneYearAgoPlus10.setDate(oneYearAgo.getDate() + 10);

            if (params.status === 'EXPIRED') {
                where.startDate = { lt: oneYearAgo };
            } else if (params.status === 'CRITICAL') {
                where.startDate = {
                    gte: oneYearAgo,
                    lte: oneYearAgoPlus10
                };
            } else if (params.status === 'ACTIVE') {
                where.startDate = { gt: oneYearAgoPlus10 };
            }
        }

        // 1. Get all unique TC numbers that match the filtered criteria
        // This ensures the pagination is based on unique customers, not individual policies.
        const uniqueTCGroups = await prisma.insurance.groupBy({
            by: ['tcNo'],
            where,
            _min: {
                startDate: true
            },
            orderBy: {
                _min: {
                    startDate: 'asc'
                }
            }
        });

        const total = uniqueTCGroups.length;
        const pagedTCs = uniqueTCGroups.slice(skip, skip + limit).map(g => g.tcNo);

        // 2. Fetch all insurances for these specific paged customers
        const allInsurances = await prisma.insurance.findMany({
            where: {
                tcNo: { in: pagedTCs }
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
            orderBy: { startDate: 'asc' },
        });

        // 3. Reconstruct client-centric objects
        // We preserve the order from uniqueTCGroups
        const groupedData = pagedTCs.map(tc => {
            const clientInsurances = allInsurances.filter(i => i.tcNo === tc);
            if (clientInsurances.length === 0) return null;

            const primary = clientInsurances[0]!;

            return {
                tcNo: tc,
                fullName: primary.fullName,
                phone: primary.phone,
                profession: primary.profession,
                plate: primary.plate,
                insuranceCount: clientInsurances.length,
                insurances: clientInsurances,
                representativeInsurance: primary
            };
        }).filter(Boolean);

        return {
            data: groupedData,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    createInsurance: async (data: Prisma.InsuranceCreateInput) => {
        try {
            return await prisma.insurance.create({
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
        } catch (error: any) {
            if (error.code === 'P2002' && error.meta?.target?.includes('policyNo')) {
                throw ApiError.conflict('Bu poliçe numarasıyla zaten bir kayıt mevcut. Lütfen farklı bir poliçe numarası girin.');
            }
            throw error;
        }
    },

    updateInsurance: async (id: string, data: Partial<Prisma.InsuranceUpdateInput>) => {
        try {
            return await prisma.insurance.update({
                where: { id },
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
        } catch (error: any) {
            if (error.code === 'P2002' && error.meta?.target?.includes('policyNo')) {
                throw ApiError.conflict('Bu poliçe numarasıyla zaten bir kayıt mevcut. Lütfen farklı bir poliçe numarası girin.');
            }
            throw error;
        }
    },

    deleteInsurance: async (id: string) => {
        return prisma.insurance.delete({
            where: { id },
        });
    },

    importInsurances: async (buffer: Buffer | any) => {
        console.log('[IMPORT] Starting import process...');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0]; // first sheet

        if (!worksheet) {
            throw new Error('Excel is empty or missing worksheet');
        }

        console.log(`[IMPORT] Worksheet found. Total rows: ${worksheet.rowCount}`);

        const headers: Record<number, string> = {};
        let headerRowIdx = 1;

        // Find the header row (assume row 1)
        worksheet.getRow(headerRowIdx).eachCell((cell, colNumber) => {
            if (cell.value) {
                headers[colNumber] = cell.value.toString().trim().toUpperCase();
            }
        });

        console.log('[IMPORT] Detected headers:', JSON.stringify(headers));

        // Ensure we matched required headers (case-insensitive)
        const requiredHeaders = ['BAŞLANGIÇ TARİHİ', 'TC', 'İSİM / SOYİSİM', 'ŞİRKET'];
        const missingHeaders = requiredHeaders.filter(
            (rh) => !Object.values(headers).some(h => h.includes(rh))
        );

        if (missingHeaders.length > 0) {
            console.error('[IMPORT] Missing required columns:', missingHeaders);
            throw new Error(`Gerekli sütunlar eksik: ${missingHeaders.join(', ')}`);
        }

        const validRows: any[] = [];
        const failedRows: any[] = [];
        let currentMonth = '';

        const parseBranch = (val: string): InsuranceBranch => {
            if (!val) return InsuranceBranch.DIGER;
            const up = val.toUpperCase().trim();
            if (Object.values(InsuranceBranch).includes(up as InsuranceBranch)) {
                return up as InsuranceBranch;
            }
            if (up.includes('KASKO')) return InsuranceBranch.KASKO;
            if (up.includes('TRAFİK')) return InsuranceBranch.TRAFIK;
            if (up.includes('DASK')) return InsuranceBranch.DASK;
            if (up.includes('SAĞLIK')) return InsuranceBranch.SAGLIK;
            if (up.includes('KONUT')) return InsuranceBranch.KONUT;
            if (up.includes('İŞYERİ')) return InsuranceBranch.DIGER;
            return InsuranceBranch.DIGER;
        };

        const getCellValue = (cell: ExcelJS.Cell): any => {
            if (!cell || cell.value === null || cell.value === undefined) return null;
            if (typeof cell.value === 'object') {
                const cellVal = cell.value as any;
                if ('result' in cellVal) return cellVal.result;
                if ('richText' in cellVal && Array.isArray(cellVal.richText)) {
                    return cellVal.richText.map((rt: any) => rt.text).join('');
                }
                if ('text' in cellVal) return cellVal.text;
                if ('hyperlink' in cellVal) return cellVal.text || cellVal.hyperlink;
            }
            return cell.value;
        };

        const sanitizeString = (val: any): string => {
            if (val === null || val === undefined) return '';
            let str = val.toString().trim();
            // Remove scientific notation artifacts or ".0" from integer-like numbers
            if (/^\d+\.0+$/.test(str)) {
                str = str.split('.')[0];
            }
            return str;
        };


        const parseNumber = (val: any): number => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return Math.round(val * 100) / 100;
            let str = val.toString().trim();
            if (!str) return 0;
            // Handle Turkish format: 1.234,56
            if (str.includes(',') && str.includes('.')) {
                if (str.lastIndexOf('.') < str.lastIndexOf(',')) {
                    str = str.replace(/\./g, '').replace(',', '.');
                } else {
                    str = str.replace(/,/g, '');
                }
            } else if (str.includes(',')) {
                str = str.replace(',', '.');
            }
            // Remove non-numeric except dot and minus
            str = str.replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(str);
            return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
        };

        const parseDate = (val: any): Date | null => {
            if (!val) return null;
            let date: Date | null = null;

            if (val instanceof Date) {
                date = val;
            } else if (typeof val === 'number') {
                date = new Date((val - 25569) * 86400 * 1000);
            } else {
                const str = val.toString().trim();
                if (!str) return null;

                const dotParts = str.split('.');
                if (dotParts.length === 3) {
                    const day = parseInt(dotParts[0], 10);
                    const month = parseInt(dotParts[1], 10) - 1;
                    const year = parseInt(dotParts[2], 10);
                    date = new Date(year, month, day);
                } else {
                    const slashParts = str.split('/');
                    if (slashParts.length === 3) {
                        const day = parseInt(slashParts[0], 10);
                        const month = parseInt(slashParts[1], 10) - 1;
                        const year = parseInt(slashParts[2], 10);
                        date = new Date(year, month, day);
                    } else {
                        const parsed = new Date(str);
                        if (!isNaN(parsed.getTime())) date = parsed;
                    }
                }
            }

            if (date && !isNaN(date.getTime())) {
                date.setHours(0, 0, 0, 0); // Normalize to start of day
                return date;
            }
            return null;
        };

        const findColIndex = (name: string) => {
            const upName = name.toUpperCase();
            const entry = Object.entries(headers).find(([_, val]) => val.includes(upName));
            return entry ? Number(entry[0]) : null;
        };

        const policyColIdx = findColIndex('POLİÇE NO');
        const nameColIdx = findColIndex('İSİM / SOYİSİM');
        const descriptionColIdx = findColIndex('AÇIKLAMA');
        const professionColIdx = findColIndex('MESLEK');

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === headerRowIdx) return; // skip header

            let hasAnyValue = false;
            let rowText = '';
            row.eachCell((cell) => {
                const val = getCellValue(cell);
                if (val !== null && val !== undefined && val.toString().trim() !== '') {
                    hasAnyValue = true;
                    rowText += val.toString().toUpperCase() + ' ';
                }
            });

            if (!hasAnyValue) return;

            // Check if it's a month header row (sticky month)
            for (const month of TURKISH_MONTHS) {
                if (rowText.includes(month)) {
                    currentMonth = month;
                    // If this row ONLY has the month name, skip processing it as a data row
                    if (rowText.trim() === month) return;
                }
            }

            let rowData: any = {};
            try {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const headerName = headers[colNumber];
                    if (!headerName) return;

                    const mappedKeyEntry = Object.entries(COLUMN_MAP).find(
                        ([key]) => headerName.includes(key.toUpperCase())
                    );
                    const mappedKey = mappedKeyEntry?.[1];

                    if (mappedKey) {
                        rowData[mappedKey] = getCellValue(cell);
                    }
                });

                // Month Handling
                rowData.month = rowData.month || currentMonth;

                // Smart Policy/TC/Company Harvesting
                rowData.tcNo = sanitizeString(rowData.tcNo);
                rowData.policyNo = sanitizeString(rowData.policyNo);
                rowData.fullName = sanitizeString(rowData.fullName);
                rowData.company = sanitizeString(rowData.company);

                // --- FALLBACKS & PLACEHOLDERS ---

                // 1. Name check - if no name, skip silently
                if (!rowData.fullName) {
                    return;
                }

                // 2. TC Placeholder
                if (!rowData.tcNo) {
                    rowData.tcNo = '11111111111';
                }

                // 3. Company Placeholder
                if (!rowData.company) {
                    rowData.company = 'BELİRTİLMEDİ';
                }

                // 5. Date Placeholder (Use today if missing or invalid)
                let startDate = parseDate(rowData.startDate);
                if (!startDate) {
                    startDate = new Date();
                    startDate.setHours(0, 0, 0, 0);
                }

                // 4. Policy Number Harvesting & Placeholder (Refined for uniqueness)
                if (!rowData.policyNo) {
                    const searchableText = `${rowData.description || ''} ${rowData.profession || ''} ${rowData.fullName || ''} ${rowText}`;
                    const daskMatch = searchableText.match(/(?:DASK\s+)?POLİÇE\s+NO[:\s]+([A-Z0-9.\-/]{5,})/i);
                    if (daskMatch && daskMatch[1]) {
                        rowData.policyNo = daskMatch[1].trim();
                    } else {
                        const genericPolicyMatch = searchableText.match(/(\d{8,15})/);
                        if (genericPolicyMatch && genericPolicyMatch[1] !== rowData.tcNo) {
                            rowData.policyNo = genericPolicyMatch[1];
                        }
                    }
                }

                // If STILL missing policy number, generate a temporary one (STRONGER Uniqueness: TC + Name + Amount + Date)
                if (!rowData.policyNo) {
                    const namePart = rowData.fullName.replace(/\u0020/g, '').slice(0, 10).toUpperCase();
                    const amountPart = Math.abs(parseNumber(rowData.amount)).toString().replace('.', '_');
                    const datePart = startDate.getTime();
                    rowData.policyNo = `AUTO-${rowData.tcNo}-${namePart}-${amountPart}-${datePart}`;
                }

                // Final required field check
                if (!rowData.policyNo || !rowData.tcNo) {
                    throw new Error(`Eksik bilgiler. Poliçe: ${rowData.policyNo ? 'Tam' : 'YOK'}, TC: ${rowData.tcNo ? 'Tam' : 'YOK'}`);
                }

                validRows.push({
                    month: rowData.month?.toString() || '',
                    startDate: startDate,
                    tcNo: rowData.tcNo,
                    fullName: rowData.fullName,
                    profession: rowData.profession?.toString() || null,
                    phone: rowData.phone?.toString() || null,
                    plate: rowData.plate?.toString() || null,
                    serialOrOrderNo: rowData.serialOrOrderNo?.toString() || null,
                    amount: parseNumber(rowData.amount),
                    branch: parseBranch(rowData.branch?.toString() || rowText), // Try to find branch in full row text if empty
                    company: rowData.company,
                    policyNo: rowData.policyNo,
                    description: rowData.description?.toString() || null,
                    adminRead: true,
                });

            } catch (err: any) {
                failedRows.push({
                    rowNumber,
                    error: err.message,
                    rowData: {
                        policyNo: rowData.policyNo || 'Bilinmiyor',
                        fullName: rowData.fullName || 'Bilinmiyor'
                    }
                });
            }
        });

        console.log(`[IMPORT] Parsing complete. Valid rows: ${validRows.length}, Failed rows: ${failedRows.length}`);

        const BATCH_SIZE = 500;
        let insertedCount = 0;

        if (validRows.length > 0) {
            for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
                const batch = validRows.slice(i, i + BATCH_SIZE);
                await prisma.$transaction(async (tx) => {
                    // Pre-check for exact duplicates to handle rows that might not trigger unique constraint
                    // but are considered duplicates by the user (Same person, same amount, same date, same plate)
                    const existing = await tx.insurance.findMany({
                        where: {
                            tcNo: { in: batch.map(b => b.tcNo) }
                        },
                        select: {
                            tcNo: true,
                            fullName: true,
                            amount: true,
                            startDate: true,
                            plate: true,
                            policyNo: true,
                            branch: true,
                            company: true,
                            month: true,
                            profession: true,
                            phone: true,
                            serialOrOrderNo: true,
                            description: true
                        }
                    });

                    const trulyNew = batch.filter(row => {
                        const isMatch = existing.some(ext =>
                            ext.tcNo === row.tcNo &&
                            ext.fullName === row.fullName &&
                            Number(ext.amount) === row.amount &&
                            ext.startDate.getTime() === row.startDate.getTime() &&
                            (ext.plate || null) === (row.plate || null) &&
                            ext.policyNo === row.policyNo &&
                            ext.branch === row.branch &&
                            ext.company === row.company &&
                            ext.month === row.month &&
                            (ext.profession || null) === (row.profession || null) &&
                            (ext.phone || null) === (row.phone || null) &&
                            (ext.serialOrOrderNo || null) === (row.serialOrOrderNo || null) &&
                            (ext.description || null) === (row.description || null)
                        );
                        if (isMatch) {
                            console.log(`[IMPORT] Skipping Exact Duplicate: Row with TC ${row.tcNo}, Name ${row.fullName}, Amount ${row.amount}`);
                        }
                        return !isMatch;
                    });

                    if (trulyNew.length > 0) {
                        const result = await tx.insurance.createMany({
                            data: trulyNew,
                            skipDuplicates: true,
                        });
                        insertedCount += result.count;
                    }
                });
            }
        }

        const duplicateCount = validRows.length - insertedCount;
        console.log(`[IMPORT] DB insert complete. Newly inserted: ${insertedCount}. Skipped as duplicates: ${duplicateCount}`);

        return {
            insertedCount,
            duplicateCount,
            failedCount: failedRows.length,
            failedRows,
        };
    },

    exportInsurances: async () => {
        const insurances = await prisma.insurance.findMany({
            orderBy: { createdAt: 'desc' },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sigortalar');

        worksheet.columns = [
            { header: 'AY', key: 'month', width: 10 },
            { header: 'BAŞLANGIÇ TARİHİ', key: 'startDate', width: 15 },
            { header: 'TC', key: 'tcNo', width: 15 },
            { header: 'İSİM / SOYİSİM', key: 'fullName', width: 25 },
            { header: 'MESLEK', key: 'profession', width: 20 },
            { header: 'CEP', key: 'phone', width: 15 },
            { header: 'PLAKA', key: 'plate', width: 15 },
            { header: 'SERİ NO / SIRA NO', key: 'serialOrOrderNo', width: 20 },
            { header: 'TL', key: 'amount', width: 15 },
            { header: 'BRANŞ', key: 'branch', width: 15 },
            { header: 'ŞİRKET', key: 'company', width: 20 },
            { header: 'POLİÇE NO', key: 'policyNo', width: 20 },
            { header: 'AÇIKLAMA', key: 'description', width: 30 },
        ];

        insurances.forEach((ins: any) => {
            worksheet.addRow({
                month: ins.month,
                startDate: new Date(ins.startDate).toLocaleDateString('tr-TR'),
                tcNo: ins.tcNo,
                fullName: ins.fullName,
                profession: ins.profession || '',
                phone: ins.phone || '',
                plate: ins.plate || '',
                serialOrOrderNo: ins.serialOrOrderNo || '',
                amount: ins.amount,
                branch: ins.branch,
                company: ins.company,
                policyNo: ins.policyNo,
                description: ins.description || '',
            });
        });

        return workbook;
    },

    searchClients: async (query: string) => {
        if (!query || query.length < 2) return [];

        const queryVariations = getSearchVariations(query);

        const groups = await prisma.insurance.groupBy({
            by: ['tcNo'],
            where: {
                OR: [
                    ...queryVariations.map(v => ({ fullName: { contains: v, mode: 'insensitive' as const } })),
                    { tcNo: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 10,
            orderBy: {
                tcNo: 'asc'
            }
        });

        const tcs = groups.map((g: any) => g.tcNo);
        if (tcs.length === 0) return [];

        return await prisma.insurance.findMany({
            where: { tcNo: { in: tcs } },
            orderBy: { createdAt: 'desc' },
            distinct: ['tcNo'],
            select: {
                tcNo: true,
                fullName: true,
                phone: true,
                profession: true,
                plate: true,
                userId: true,
            },
        });
    },

    renewInsurance: async (id: string, customStartDate?: Date | string) => {
        const source = await prisma.insurance.findUnique({
            where: { id }
        });

        if (!source) throw new Error('Yenilenecek poliçe bulunamadı.');

        let startDate = new Date();
        if (customStartDate) {
            startDate = new Date(customStartDate);
        }
        startDate.setHours(0, 0, 0, 0);

        const currentMonth = TURKISH_MONTHS[startDate.getMonth()] || '';

        return await prisma.insurance.create({
            data: {
                tcNo: source.tcNo,
                fullName: source.fullName,
                profession: source.profession,
                phone: source.phone,
                plate: source.plate,
                serialOrOrderNo: source.serialOrOrderNo,
                amount: source.amount,
                branch: source.branch,
                company: source.company,
                policyNo: `${source.policyNo}-YENI`,
                description: `[YENİLEME] Eski poliçe: ${source.policyNo}`,
                month: currentMonth,
                startDate: startDate,
                userId: source.userId,
                adminRead: true,
            }
        });
    },

    getInsuranceStats: async () => {
        const stats = await prisma.insurance.groupBy({
            by: ['branch'],
            _count: {
                id: true
            },
            _sum: {
                amount: true
            }
        });

        return stats.map(s => ({
            branch: s.branch,
            count: s._count.id,
            revenue: s._sum.amount || 0
        }));
    }
};
