import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';
import type { DashboardStats } from '../../services/types';

export interface DashboardState {
    stats: DashboardStats | null;
    revenueData: any | null; // For the chart
    loading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    stats: null,
    revenueData: null,
    loading: false,
    error: null,
};

export const fetchDashboardStats = createAsyncThunk(
    'dashboard/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const data = await adminService.getDashboard();
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Dashboard verileri alınamadı');
        }
    }
);

export const fetchRevenueAnalytics = createAsyncThunk(
    'dashboard/fetchRevenue',
    async (year: number | undefined, { rejectWithValue }) => {
        try {
            const data = await adminService.getRevenueAnalytics(year);
            return data;
        } catch (err: any) {
            // Revenue analytics might fail, but shouldn't block the whole dashboard
            return rejectWithValue(err.response?.data?.message || 'Gelir verileri alınamadı');
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDashboardError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Stats
            .addCase(fetchDashboardStats.pending, (state) => {
                // state.loading = true; // Do not block UI on background fetches
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
                state.loading = false;
                state.stats = action.payload;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Revenue
            .addCase(fetchRevenueAnalytics.fulfilled, (state, action) => {
                state.revenueData = action.payload;
            });
    },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
