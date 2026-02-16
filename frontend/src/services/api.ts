import axios from 'axios';
import type {
    Car,
    Booking,
    CreateBookingRequest,
    AuthResponse,
    PaginatedResponse,
    DashboardStats
} from './types';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const carService = {
    getAll: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Car>>('/cars', { params });
        return response.data;
    },
    getById: async (id: string) => {
        const response = await api.get<{ data: Car }>(`/cars/${id}`);
        return response.data.data;
    },
    getAvailability: async (id: string, from: string, to: string) => {
        const response = await api.get<{ data: any }>(`/cars/${id}/availability`, { params: { from, to } });
        return response.data.data;
    }
};

export const brandService = {
    getAll: async () => {
        const response = await api.get<{ id: string; name: string; logoUrl: string }[]>('/brands');
        return response.data;
    },
    getAllAdmin: async () => {
        const response = await api.get<{ id: string; name: string; logoUrl: string }[]>('/brands/all');
        return response.data;
    }
};

export const bookingService = {
    create: async (data: CreateBookingRequest) => {
        const response = await api.post<{ data: { bookingCode: string; booking: Booking } }>('/bookings', data);
        return response.data;
    },
    getByCode: async (code: string) => {
        const response = await api.get<{ success: boolean; data: { booking: Booking; summary: any } }>(`/bookings/${code}`);
        return response.data.data;
    },
    lookupByPhone: async (phone: string) => {
        const response = await api.get<{ data: Booking[] }>('/bookings/lookup/phone', { params: { phone } });
        return response.data.data;
    },
    extend: async (code: string, newDropoffDate: string) => {
        const response = await api.patch<{ data: { booking: Booking; additionalPrice: number } }>(`/bookings/${code}/extend`, { newDropoffDate });
        return response.data.data;
    },
    pay: async (code: string, cardDetails: any) => {
        const response = await api.post<{ success: true; message: string; data: any }>(`/bookings/${code}/pay`, cardDetails);
        return response.data;
    }
};

export const adminService = {
    login: async (credentials: any) => {
        const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
        if (response.data.data.token) {
            localStorage.setItem('token', response.data.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        return response.data.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    getDashboard: async () => {
        const response = await api.get<{ data: DashboardStats }>('/admin/dashboard');
        return response.data.data;
    },
    getBookings: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
        return response.data;
    },
    updateBookingDates: async (id: string, dates: { pickupDate: Date; dropoffDate: Date }) => {
        const response = await api.patch(`/admin/bookings/${id}/dates`, dates);
        return response.data;
    },
    cancelBooking: async (id: string) => {
        const response = await api.patch(`/admin/bookings/${id}/cancel`);
        return response.data;
    },
    startBooking: async (id: string) => {
        const response = await api.patch(`/admin/bookings/${id}/start`);
        return response.data;
    },
    completeBooking: async (id: string) => {
        const response = await api.patch(`/admin/bookings/${id}/complete`);
        return response.data;
    },
    createManualBooking: async (data: any) => {
        const response = await api.post('/admin/bookings', data);
        return response.data;
    },
    // Car management
    getCars: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Car>>('/cars', { params });
        return response.data;
    },
    createCar: async (data: any) => {
        const response = await api.post<{ data: Car }>('/cars', data);
        return response.data.data;
    },
    updateCar: async (id: string, data: any) => {
        const response = await api.patch<{ data: Car }>(`/cars/${id}`, data);
        return response.data.data;
    },
    deleteCar: async (id: string) => {
        const response = await api.delete(`/cars/${id}`);
        return response.data;
    },
    // Branches
    getBranches: async () => {
        const response = await api.get<{ success: boolean; data: { id: string; name: string; city: string }[] }>('/branches');
        return response.data.data;
    },
    // Insurance
    getInsurances: async (params?: any) => {
        const response = await api.get<{ success: boolean; data: any[]; pagination: any }>('/admin/insurances', { params });
        return response.data;
    },
    createInsurance: async (data: any) => {
        const response = await api.post<{ success: boolean; data: any }>('/admin/insurances', data);
        return response.data.data;
    },
    exportInsurances: async () => {
        return api.get('/admin/insurances/export', {
            responseType: 'blob',
        });
    },
    // Users
    getUsers: async () => {
        const response = await api.get<{ success: boolean; data: { id: string; name: string; email: string; phone: string }[] }>('/admin/users');
        return response.data.data;
    },
    // Revenue Analytics
    getRevenueAnalytics: async (year?: number) => {
        const params = year ? { year } : {};
        const response = await api.get<{ success: boolean; data: any }>('/admin/revenue', { params });
        return response.data.data;
    },
    // Franchise Applications
    getFranchiseApplications: async (params?: any) => {
        const response = await api.get<{ success: boolean; data: any[]; pagination: any }>('/admin/franchise-applications', { params });
        return response.data;
    },
    getFranchiseApplicationById: async (id: string) => {
        const response = await api.get<{ success: boolean; data: any }>(`/admin/franchise-applications/${id}`);
        return response.data.data;
    },
    updateFranchiseStatus: async (id: string, status: string, adminNote?: string) => {
        const response = await api.patch<{ success: boolean; data: any }>(`/admin/franchise-applications/${id}/status`, { status, adminNote });
        return response.data.data;
    },
    markNotificationRead: async (id: string, type: 'booking' | 'franchise') => {
        const response = await api.post('/admin/notifications/mark-read', { id, type });
        return response.data;
    },
    markAllNotificationsRead: async () => {
        const response = await api.post('/admin/notifications/mark-all-read');
        return response.data;
    }
};

export const uploadService = {
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<{ success: boolean; data: { url: string } }>('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data.url;
    }
};

export const franchiseService = {
    submitApplication: async (data: {
        contactName: string;
        contactEmail: string;
        contactPhone: string;
        companyName?: string;
        city: string;
        investmentBudget?: string;
        experience?: string;
        message?: string;
    }) => {
        const response = await api.post<{ success: boolean; data: { id: string; applicationNumber: string } }>('/franchise-applications/public', data);
        return response.data.data;
    }
};

export default api;
