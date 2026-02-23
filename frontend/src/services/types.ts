export interface Car {
    id: string;
    brand: string;
    brandLogo?: string;
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
    isFeatured: boolean;
    accidentDescription?: string;
    changedParts?: string[];
    paintedParts?: string[];
    features?: string[];
    type?: 'RENTAL' | 'SALE';
    salePrice?: string | number;
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
    expiresAt?: string;
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

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    phone?: string;
    whatsappEnabled?: boolean;
    createdAt?: string;
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
    pendingFranchiseApplications: number;
    newBookingsCount: number;
    latestNewBookings: any[];
    latestPendingFranchiseApplications: any[];
    latestPaidBookings: any[];
    totalInsurances: number;
    newInsurancesCount: number;
    latestExpiringInsurances: any[];
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

export type InsuranceBranch = 'KASKO' | 'DASK' | 'TRAFIK' | 'KONUT' | 'SAGLIK' | 'DIGER';

export interface UserInsurance {
    id: string;
    month: string;
    startDate: string;
    tcNo: string;
    fullName: string;
    profession?: string;
    phone?: string;
    plate?: string;
    serialOrOrderNo?: string;
    amount: number;
    branch: InsuranceBranch;
    company: string;
    policyNo: string;
    description?: string;

    userId?: string;
    user?: {
        name: string;
        email: string;
    };
    adminRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ActionLog {
    id: string;
    userId: string;
    user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    action: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}
