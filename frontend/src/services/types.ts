export interface Car {
    id: string;
    brand: string;
    model: string;
    year: number;
    transmission: 'MANUAL' | 'AUTO';
    fuel: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG';
    category: 'ECONOMY' | 'COMPACT' | 'MIDSIZE' | 'FULLSIZE' | 'SUV' | 'VAN' | 'LUXURY';
    seats: number;
    doors: number;
    color: string;
    plateNumber: string;
    dailyPrice: string | number; // Decimal comes as string often, but we handle number
    mileage: number;
    images: string[];
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    description?: string;
    branchId: string;
    branch?: Branch;
}

export interface Branch {
    id: string;
    name: string;
    address: string;
    city: string;
    phone?: string;
}

export interface Booking {
    id: string;
    bookingCode: string;
    carId: string;
    car?: Car;
    userId?: string;
    customerName: string;
    customerSurname: string;
    customerPhone: string;
    customerEmail?: string;
    customerTC?: string;
    customerDriverLicense: string;
    notes?: string;
    pickupDate: string; // ISO Date string
    dropoffDate: string; // ISO Date string
    originalDropoffDate?: string;
    pickupBranchId: string;
    pickupBranch?: Branch;
    dropoffBranchId: string;
    dropoffBranch?: Branch;
    totalPrice: number;
    status: 'RESERVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    paymentStatus: 'UNPAID' | 'PAID';
    paymentRef?: string;
    paidAt?: string;
    createdAt: string;
}

export interface CreateBookingRequest {
    carId: string;
    customerName: string;
    customerSurname: string;
    customerPhone: string;
    customerEmail: string;
    customerTC?: string;
    customerDriverLicense: string;
    pickupDate: string;
    dropoffDate: string;
    pickupBranchId: string;
    dropoffBranchId: string;
    notes?: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface DashboardStats {
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    totalCars: number;
    recentBookings: Booking[];
    revenueByMonth: { month: string; revenue: number }[];
    pendingFranchiseApplications: number;
    newBookingsCount: number;
    latestNewBookings: any[];
    latestPendingFranchiseApplications: any[];
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
