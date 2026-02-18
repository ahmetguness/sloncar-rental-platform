import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';
import type { Booking } from '../../services/types';
import type { RootState } from '../../store';

export const bookingsAdapter = createEntityAdapter<Booking>({
    sortComparer: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
});

export interface BookingsState {
    loading: boolean;
    error: string | null;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const initialState = bookingsAdapter.getInitialState<BookingsState>({
    loading: false,
    error: null,
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
});

export const fetchBookings = createAsyncThunk(
    'bookings/fetchAll',
    async (params: any, { rejectWithValue }) => {
        try {
            const response = await adminService.getBookings(params);
            return response;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Rezervasyonlar yüklenemedi');
        }
    }
);

const bookingsSlice = createSlice({
    name: 'bookings',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBookings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookings.fulfilled, (state, action) => {
                state.loading = false;
                bookingsAdapter.setAll(state, action.payload.data);
                state.total = action.payload.pagination.total;
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
            })
            .addCase(fetchBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    selectAll: selectAllBookings,
    selectById: selectBookingById,
    selectIds: selectBookingIds
} = bookingsAdapter.getSelectors<RootState>((state) => state.bookings);

export default bookingsSlice.reducer;
