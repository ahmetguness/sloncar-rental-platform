import prisma from '../../lib/prisma.js';
import { BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ApiError } from '../../middlewares/errorHandler.js';

export interface DashboardStats {
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    totalCars: number;
    totalUsers: number;
    recentBookings: any[];
    pendingFranchiseApplications: number;
    newBookingsCount: number;
    latestNewBookings: any[];
    latestPendingFranchiseApplications: any[];
    latestPaidBookings: any[];
    totalInsurances: number;
}

export async function markNotificationRead(id: string, type: 'booking' | 'franchise'): Promise<void> {
    if (type === 'booking') {
        // ID might have suffix like _paid, remove it if present, though usually we pass raw ID
        // The frontend passes exact ID. For paid bookings, we might have a suffix in frontend state but we should pass distinct ID?
        // Actually, for paid bookings, the notification ID in frontend is "id_paid".
        // We should handle that.
        const cleanId = id.replace('_paid', '');
        await prisma.booking.update({
            where: { id: cleanId },
            data: { adminRead: true }
        });
    } else if (type === 'franchise') {
        await prisma.franchiseApplication.update({
            where: { id },
            data: { adminRead: true }
        });
    }
}

export async function markAllNotificationsRead(): Promise<void> {
    await Promise.all([
        prisma.booking.updateMany({
            where: { adminRead: false },
            data: { adminRead: true }
        }),
        prisma.franchiseApplication.updateMany({
            where: { adminRead: false },
            data: { adminRead: true }
        })
    ]);
}

export interface RevenueAnalytics {
    weekly: { week: string; revenue: number; bookings: number }[];
    monthly: { month: string; revenue: number; bookings: number }[];
    yearly: { year: number; revenue: number; bookings: number }[];
    byCategory: { name: string; value: number }[];
    byBrand: { name: string; value: number }[];
    availableYears: number[];
    summary: {
        currentMonth: number;
        lastMonth: number;
        currentYear: number;
        growth: number;
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {


    const [
        totalBookings,
        activeBookings,
        revenueAggregate,
        totalCars,
        totalUsers,
        recentBookings,
        pendingFranchiseApplications,
        newBookingsCount,
        latestNewBookings,
        latestPendingFranchiseApplications,
        latestPaidBookings,
        totalInsurances
    ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: BookingStatus.ACTIVE } }),
        prisma.booking.aggregate({
            where: { status: BookingStatus.COMPLETED },
            _sum: { totalPrice: true }
        }),
        prisma.car.count(),
        prisma.user.count(),
        prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                car: { select: { brand: true, model: true } }
            }
        }),
        prisma.franchiseApplication.count({ where: { status: 'SUBMITTED' } }),
        prisma.booking.count({ where: { status: 'RESERVED' } }),
        prisma.booking.findMany({
            where: { status: 'RESERVED' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { car: { select: { brand: true, model: true } } }
        }),
        prisma.franchiseApplication.findMany({
            where: { status: 'SUBMITTED' },
            take: 5,
            orderBy: { submittedAt: 'desc' }
        }),
        prisma.booking.findMany({
            where: { paymentStatus: 'PAID' },
            take: 5,
            orderBy: { paidAt: 'desc' },
            include: { car: { select: { brand: true, model: true } } }
        }),
        prisma.userInsurance.count({ where: { isActive: true } })
    ]);

    const totalRevenue = Number(revenueAggregate._sum.totalPrice || 0);

    return {
        totalRevenue,
        totalBookings,
        activeBookings,
        totalCars,
        totalUsers,
        recentBookings,
        pendingFranchiseApplications,
        newBookingsCount,
        latestNewBookings,
        latestPendingFranchiseApplications,
        latestPaidBookings,
        totalInsurances
    };
}

export async function getRevenueAnalytics(year?: number): Promise<RevenueAnalytics> {
    const currentYear = year || new Date().getFullYear();
    const today = new Date();

    // 1. Prepare date ranges
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const weeksAgo12 = new Date();
    weeksAgo12.setDate(weeksAgo12.getDate() - (12 * 7));
    const startOf5YearsAgo = new Date(today.getFullYear() - 4, 0, 1);

    const paidNotCancelled = { paymentStatus: 'PAID' as const, status: { not: 'CANCELLED' as const } };

    // Run ALL queries in parallel instead of sequentially
    const [monthlyStats, weeklyStats, yearlyStats, oldestBooking] = await Promise.all([
        // Monthly stats using groupBy
        prisma.booking.groupBy({
            by: ['pickupDate'],
            where: {
                ...paidNotCancelled,
                pickupDate: { gte: startOfYear, lte: endOfYear }
            },
            _sum: { totalPrice: true },
            _count: { _all: true }
        }),
        // Weekly stats (last 12 weeks)
        prisma.booking.groupBy({
            by: ['pickupDate'],
            where: {
                ...paidNotCancelled,
                pickupDate: { gte: weeksAgo12 }
            },
            _sum: { totalPrice: true },
            _count: { _all: true }
        }),
        // Yearly stats (last 5 years)
        prisma.booking.groupBy({
            by: ['pickupDate'],
            where: {
                ...paidNotCancelled,
                pickupDate: { gte: startOf5YearsAgo }
            },
            _sum: { totalPrice: true },
            _count: { _all: true }
        }),
        prisma.booking.findFirst({
            orderBy: { pickupDate: 'asc' },
            select: { pickupDate: true }
        })
    ]);

    // For Category and Brand distribution, we still need a grouped query or discrete queries
    const [categoryStats, brandStats] = await Promise.all([
        prisma.booking.findMany({
            where: { ...paidNotCancelled, pickupDate: { gte: startOfYear, lte: endOfYear } },
            select: { totalPrice: true, car: { select: { category: true } } }
        }),
        prisma.booking.findMany({
            where: { ...paidNotCancelled, pickupDate: { gte: startOfYear, lte: endOfYear } },
            select: { totalPrice: true, car: { select: { brand: true } } }
        })
    ]);

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Process Monthly
    const monthly = monthNames.map((name, index) => {
        const monthFiltered = monthlyStats.filter(s => s.pickupDate.getMonth() === index);
        return {
            month: name,
            revenue: monthFiltered.reduce((sum, s) => sum + Number(s._sum.totalPrice || 0), 0),
            bookings: monthFiltered.reduce((sum, s) => sum + s._count._all, 0)
        };
    });

    // Process Category & Brand
    const categoryMap = new Map<string, number>();
    categoryStats.forEach(s => {
        const cat = s.car?.category || 'Diğer';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(s.totalPrice || 0));
    });
    const byCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const brandMap = new Map<string, number>();
    brandStats.forEach(s => {
        const brand = s.car?.brand || 'Diğer';
        brandMap.set(brand, (brandMap.get(brand) || 0) + Number(s.totalPrice || 0));
    });
    const byBrand = Array.from(brandMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);

    // Process Weekly
    const weekly: { week: string; revenue: number; bookings: number }[] = [];
    for (let i = 11; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekData = weeklyStats.filter(s => s.pickupDate >= weekStart && s.pickupDate < weekEnd);
        const monthName = monthNames[weekStart.getMonth()] || 'Oca';

        weekly.push({
            week: `${Math.ceil(weekStart.getDate() / 7)}. Hafta ${monthName.slice(0, 3)}`,
            revenue: weekData.reduce((sum, s) => sum + Number(s._sum.totalPrice || 0), 0),
            bookings: weekData.reduce((sum, s) => sum + s._count._all, 0)
        });
    }

    // Process Yearly
    const yearlyMap = new Map<number, { revenue: number; count: number }>();
    yearlyStats.forEach(s => {
        const y = s.pickupDate.getFullYear();
        const existing = yearlyMap.get(y) || { revenue: 0, count: 0 };
        existing.revenue += Number(s._sum.totalPrice || 0);
        existing.count += s._count._all;
        yearlyMap.set(y, existing);
    });

    const yearly: { year: number; revenue: number; bookings: number }[] = [];
    for (let y = today.getFullYear() - 4; y <= today.getFullYear(); y++) {
        const data = yearlyMap.get(y) || { revenue: 0, count: 0 };
        yearly.push({ year: y, revenue: data.revenue, bookings: data.count });
    }

    const availableYears = [];
    const startYear = oldestBooking ? oldestBooking.pickupDate.getFullYear() : 2020;
    for (let y = today.getFullYear(); y >= startYear; y--) availableYears.push(y);
    const uniqueYears = Array.from(new Set(availableYears)).sort((a, b) => b - a);

    const currentMonthIdx = today.getMonth();
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let currentYearRevenue = 0;

    if (currentYear === today.getFullYear()) {
        currentMonthRevenue = monthly[currentMonthIdx]?.revenue || 0;
        lastMonthRevenue = monthly[currentMonthIdx - 1]?.revenue || 0;
        currentYearRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
    } else {
        currentYearRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
    }

    const growth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return {
        weekly,
        monthly,
        yearly,
        byCategory,
        byBrand,
        availableYears: uniqueYears,
        summary: {
            currentMonth: currentMonthRevenue,
            lastMonth: lastMonthRevenue,
            currentYear: currentYearRevenue,
            growth: Math.round(growth * 10) / 10
        }
    };
}

export async function getUsers(params: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                version: true,
                createdAt: true
            },
            orderBy: { name: 'asc' },
            skip,
            take: limit
        }),
        prisma.user.count({ where })
    ]);

    return {
        data: users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function createUser(data: any) {
    const { name, email, password, phone, role } = data;


    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı var.');
    }


    const passwordHash = await bcrypt.hash(password, 12);

    return prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            phone,
            role: role || 'USER'
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            whatsappEnabled: true,
            createdAt: true,
            updatedAt: true,
            version: true
        }
    });
}

export async function deleteUser(id: string) {
    return prisma.user.delete({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
        }
    });
}

export async function updateUser(id: string, data: { role: 'ADMIN' | 'STAFF'; version?: number }) {
    const { version: expectedVersion, ...updateData } = data;

    if (expectedVersion !== undefined) {
        const result = await prisma.user.updateMany({
            where: { id, version: expectedVersion },
            data: { ...updateData, version: { increment: 1 } },
        });

        if (result.count === 0) {
            throw ApiError.conflict(
                'Bu kullanıcı başka bir admin tarafından değiştirilmiş. Lütfen sayfayı yenileyip tekrar deneyin.'
            );
        }

        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                whatsappEnabled: true,
                createdAt: true,
                updatedAt: true,
                version: true
            }
        });
    }

    return prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            whatsappEnabled: true,
            createdAt: true,
            updatedAt: true,
            version: true
        }
    });
}

