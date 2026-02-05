import prisma from '../../lib/prisma.js';
import { BookingStatus } from '@prisma/client';

export interface DashboardStats {
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    totalCars: number;
    totalUsers: number;
    recentBookings: any[];
    revenueByMonth: any[];
}

export interface RevenueAnalytics {
    weekly: { week: string; revenue: number; bookings: number }[];
    monthly: { month: string; revenue: number; bookings: number }[];
    yearly: { year: number; revenue: number; bookings: number }[];
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
        completedBookings,
        totalCars,
        totalUsers,
        recentBookings,
    ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: BookingStatus.ACTIVE } }),
        prisma.booking.findMany({
            where: { status: BookingStatus.COMPLETED },
            select: { totalPrice: true }
        }),
        prisma.car.count(),
        prisma.user.count(),
        prisma.booking.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                car: { select: { brand: true, model: true } }
            }
        })
    ]);

    const totalRevenue = completedBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

    const revenueByMonth = [
        { month: 'Ocak', revenue: 15000 },
        { month: 'Şubat', revenue: 22500 },
        { month: 'Mart', revenue: totalRevenue },
    ];

    return {
        totalRevenue,
        totalBookings,
        activeBookings,
        totalCars,
        totalUsers,
        recentBookings,
        revenueByMonth,
    };
}

export async function getRevenueAnalytics(year?: number): Promise<RevenueAnalytics> {
    const currentYear = year || new Date().getFullYear();

    // Get real bookings from database for calculation
    const allBookings = await prisma.booking.findMany({
        where: {
            OR: [
                { status: BookingStatus.COMPLETED },
                { status: BookingStatus.ACTIVE }
            ]
        },
        select: {
            totalPrice: true,
            createdAt: true,
            status: true
        }
    });

    // Calculate real totals
    const realTotal = allBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

    // Generate dummy data with realistic patterns + real data
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Weekly data - last 12 weeks with dummy values
    const weekly: { week: string; revenue: number; bookings: number }[] = [];
    const baseWeeklyRevenue = 5000 + Math.random() * 3000;
    for (let i = 11; i >= 0; i--) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekNum = Math.ceil((weekDate.getDate()) / 7);
        const monthName = monthNames[weekDate.getMonth()] || 'Oca';

        // Add variation and trend
        const seasonalMultiplier = 1 + Math.sin((weekDate.getMonth() / 6) * Math.PI) * 0.3;
        const randomVariation = 0.8 + Math.random() * 0.4;
        const revenue = Math.round(baseWeeklyRevenue * seasonalMultiplier * randomVariation);
        const bookings = Math.round(revenue / 800);

        weekly.push({
            week: `${weekNum}. Hafta ${monthName.slice(0, 3)}`,
            revenue: i === 0 ? revenue + realTotal : revenue,
            bookings
        });
    }

    // Monthly data for selected year
    const monthly: { month: string; revenue: number; bookings: number }[] = [];
    const baseMonthlyRevenue = 25000;
    const currentMonth = new Date().getMonth();

    for (let i = 0; i < 12; i++) {
        // Seasonal pattern - high in summer, low in winter
        const seasonalMultiplier = 1 + Math.sin(((i - 2) / 6) * Math.PI) * 0.4;
        const yearMultiplier = currentYear === new Date().getFullYear() ? 1 : 0.85 + (currentYear - 2020) * 0.03;
        const randomVariation = 0.9 + Math.random() * 0.2;

        let revenue = Math.round(baseMonthlyRevenue * seasonalMultiplier * yearMultiplier * randomVariation);
        let bookings = Math.round(revenue / 750);

        // For current year and current month, add real data
        if (currentYear === new Date().getFullYear() && i === currentMonth) {
            revenue += realTotal;
            bookings += allBookings.length;
        }

        // Future months in current year should be 0
        if (currentYear === new Date().getFullYear() && i > currentMonth) {
            revenue = 0;
            bookings = 0;
        }

        monthly.push({
            month: monthNames[i] || `Ay ${i + 1}`,
            revenue,
            bookings
        });
    }

    // Yearly data - last 5 years
    const yearly: { year: number; revenue: number; bookings: number }[] = [];
    for (let y = currentYear - 4; y <= currentYear; y++) {
        const growthFactor = 1 + (y - (currentYear - 4)) * 0.15; // 15% yearly growth
        const randomVariation = 0.95 + Math.random() * 0.1;
        let revenue = Math.round(200000 * growthFactor * randomVariation);
        let bookings = Math.round(revenue / 800);

        // Current year gets real data added
        if (y === new Date().getFullYear()) {
            revenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
            bookings = monthly.reduce((sum, m) => sum + m.bookings, 0);
        }

        yearly.push({ year: y, revenue, bookings });
    }

    // Available years for dropdown
    const availableYears = [];
    for (let y = new Date().getFullYear(); y >= 2020; y--) {
        availableYears.push(y);
    }

    // Summary calculations
    const currentMonthRevenue = monthly[currentMonth]?.revenue || 0;
    const lastMonthRevenue = monthly[currentMonth - 1]?.revenue || monthly[11]?.revenue || 0;
    const currentYearRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0);
    const growth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return {
        weekly,
        monthly,
        yearly,
        availableYears,
        summary: {
            currentMonth: currentMonthRevenue,
            lastMonth: lastMonthRevenue,
            currentYear: currentYearRevenue,
            growth: Math.round(growth * 10) / 10
        }
    };
}

