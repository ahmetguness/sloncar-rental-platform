import api from './api';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface Campaign {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    ctaText?: string;
    ctaLink?: string;
    isActive: boolean;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export const campaignService = {
    getPublic: async () => {
        const response = await api.get<ApiResponse<Campaign[]>>('/campaigns');
        return response.data.data;
    },

    getAll: async () => {
        const response = await api.get<ApiResponse<Campaign[]>>('/admin/campaigns');
        return response.data.data;
    },

    create: async (data: Partial<Campaign>) => {
        const response = await api.post<ApiResponse<Campaign>>('/admin/campaigns', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Campaign>) => {
        const response = await api.patch<ApiResponse<Campaign>>(`/admin/campaigns/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<void>>(`/admin/campaigns/${id}`);
        return response.data.data;
    }
};
