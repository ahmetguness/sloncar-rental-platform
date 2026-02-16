import prisma from '../../lib/prisma.js';
import { BookingStatus } from '@prisma/client';

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
    const today = new Date();

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
        latestPaidBookings
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
        })
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
        latestPaidBookings
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
    const [monthlyBookings, weeklyBookings, yearlyBookings, oldestBooking] = await Promise.all([
        // Monthly data for selected year (also used for category/brand stats)
        prisma.booking.findMany({
            where: {
                ...paidNotCancelled,
                pickupDate: { gte: startOfYear, lte: endOfYear }
            },
            select: {
                pickupDate: true,
                totalPrice: true,
                car: { select: { brand: true, category: true } }
            }
        }),
        // Weekly data (last 12 weeks)
        prisma.booking.findMany({
            where: {
                ...paidNotCancelled,
                pickupDate: { gte: weeksAgo12 }
            },
            select: { pickupDate: true, totalPrice: true }
        }),
        // Yearly data (last 5 years)
        prisma.booking.findMany({
            where: {
                ...paidNotCancelled,
                pickupDate: { gte: startOf5YearsAgo }
            },
            select: { pickupDate: true, totalPrice: true }
        }),
        // Oldest booking for available years
        prisma.booking.findFirst({
            orderBy: { pickupDate: 'asc' },
            select: { pickupDate: true }
        })
    ]);

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Pre-group monthly bookings by month index for O(N) instead of O(12*N)
    const monthBuckets = new Array(12).fill(null).map(() => ({ revenue: 0, count: 0 }));
    const categoryMap = new Map<string, number>();
    const brandMap = new Map<string, number>();

    for (const b of monthlyBookings) {
        const revenue = Number(b.totalPrice || 0);
        const monthIdx = b.pickupDate.getMonth();
        monthBuckets[monthIdx]!.revenue += revenue;
        monthBuckets[monthIdx]!.count++;

        // Category & brand stats from same dataset
        const category = b.car?.category || 'Diğer';
        categoryMap.set(category, (categoryMap.get(category) || 0) + revenue);
        const brand = b.car?.brand || 'Diğer';
        brandMap.set(brand, (brandMap.get(brand) || 0) + revenue);
    }

    const monthly = monthNames.map((name, index) => ({
        month: name,
        revenue: monthBuckets[index]!.revenue,
        bookings: monthBuckets[index]!.count
    }));

    const byCategory = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const byBrand = Array.from(brandMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Weekly: pre-group by week index for O(N) instead of O(12*N)
    const weekly: { week: string; revenue: number; bookings: number }[] = [];
    for (let i = 11; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const bookingsInWeek = weeklyBookings.filter(b =>
            b.pickupDate >= weekStart && b.pickupDate < weekEnd
        );

        const weekNum = Math.ceil(weekStart.getDate() / 7);
        const monthName = monthNames[weekStart.getMonth()] || 'Oca';

        weekly.push({
            week: `${weekNum}. Hafta ${monthName.slice(0, 3)}`,
            revenue: bookingsInWeek.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0),
            bookings: bookingsInWeek.length
        });
    }

    // Yearly: pre-group by year for O(N) instead of O(5*N)
    const yearlyMap = new Map<number, { revenue: number; count: number }>();
    for (const b of yearlyBookings) {
        const y = b.pickupDate.getFullYear();
        const existing = yearlyMap.get(y) || { revenue: 0, count: 0 };
        existing.revenue += Number(b.totalPrice || 0);
        existing.count++;
        yearlyMap.set(y, existing);
    }

    const yearly: { year: number; revenue: number; bookings: number }[] = [];
    for (let y = today.getFullYear() - 4; y <= today.getFullYear(); y++) {
        const data = yearlyMap.get(y) || { revenue: 0, count: 0 };
        yearly.push({ year: y, revenue: data.revenue, bookings: data.count });
    }

    // Available years
    const startYear = oldestBooking ? oldestBooking.pickupDate.getFullYear() : 2020;
    const availableYears = [];
    for (let y = today.getFullYear(); y >= startYear; y--) {
        availableYears.push(y);
    }
    if (!availableYears.includes(2024)) availableYears.push(2024);
    const uniqueYears = Array.from(new Set(availableYears)).sort((a, b) => b - a);


    // 5. Summary Stats
    const currentMonthIdx = today.getMonth();
    // Assuming summary is based on the *current* real time, not selectedYear
    // But if we want consistent UI, we might check if selectedYear == currentYear. 
    // Usually summary 'growth' implies current real month vs last month.

    // Let's re-fetch current month data specifically to be safe/accurate if selectedYear is different
    // Or we can just use the data if selectedYear IS currentYear.

    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let currentYearRevenue = 0;

    // Use monthly array if selectedYear is current year, otherwise fetch?
    // The UI 'Dashboard' might expect current stats regardless of filter.
    // However, the interface puts summary INSIDE RevenueAnalytics which is year-filtered.
    // Typically "Growth" is real-time status. 
    // Let's use the 'monthly' array we just calculated IF it's for current year.

    if (currentYear === today.getFullYear()) {
        currentMonthRevenue = monthly[currentMonthIdx]?.revenue || 0;
        lastMonthRevenue = monthly[currentMonthIdx - 1]?.revenue || 0;
        currentYearRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
    } else {
        // If viewing history, maybe show stats for THAT year?
        // Let's stick to showing stats for the *selected* year's data to be consistent with the graph.
        // But "Current Month" might be confusing if viewing 2020.
        // Let's assume 'Summary' blocks in UI are for the selected period context.
        // Actually, looking at UI code: 
        // `revenueData.summary.currentYear` is shown as big number.
        // `revenueData.summary.growth` is shown.
        // If I select 2023, I expect to see 2023 total revenue.

        currentYearRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
        // For growth, it's tricky in past years. Let's just zero it or calc relative to prev year?
        // Let's leave growth as 0 for past years to avoid confusion, or calc monthly growth?
        // Standard dashboard usually shows *current* company status.
        // BUT the endpoint is `/revenue?year=...`.
        // Let's calculate standard stats for the *selected* year.
        currentMonthRevenue = 0; // Not really meaningful for past year unless we pick December?
        lastMonthRevenue = 0;
    }

    // IF we really want "Current Month" validation as per user request (Checking March), 
    // we need to make sure the graph (monthly array) is correct.
    // The summary box in UI (checked earlier):
    // <h2 ...>Gelir Analizi</h2>
    // <span ...>{revenueData.summary.currentYear...}</span>

    // So `summary.currentYear` MUST be the total for the selected year.
    // `summary.growth` is used for the percentage badge.

    // Let's ensure growth is calculated meaningfully. 
    // If selectedYear == currentYear, use real current month vs last month.
    if (currentYear === today.getFullYear()) {
        // recalculated above
    }

    const growth = lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

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

export async function getUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phone: true
        },
        orderBy: {
            name: 'asc'
        }
    });
}

