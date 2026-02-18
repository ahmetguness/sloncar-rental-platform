import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';
import type { Car } from '../../services/types';
import type { RootState } from '../../store';

export const carsAdapter = createEntityAdapter<Car>();

export interface CarsState {
    loading: boolean;
    error: string | null;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const initialState = carsAdapter.getInitialState<CarsState>({
    loading: false,
    error: null,
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
});

export const fetchCars = createAsyncThunk(
    'cars/fetchAll',
    async (params: any, { rejectWithValue }) => {
        try {
            const response = await adminService.getCars(params);
            return response;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Araçlar yüklenemedi');
        }
    }
);

const carsSlice = createSlice({
    name: 'cars',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCars.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCars.fulfilled, (state, action) => {
                state.loading = false;
                carsAdapter.setAll(state, action.payload.data);
                state.total = action.payload.pagination.total;
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
            })
            .addCase(fetchCars.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    selectAll: selectAllCars,
    selectById: selectCarById
} = carsAdapter.getSelectors<RootState>((state) => state.cars);

export default carsSlice.reducer;
