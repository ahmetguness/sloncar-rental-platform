import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { settingsService } from '../../services/api';

export interface SettingsState {
    data: Record<string, string>;
    loading: boolean;
    error: string | null;
}

const initialState: SettingsState = {
    data: {},
    loading: false,
    error: null,
};

export const fetchSettings = createAsyncThunk(
    'settings/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            return await settingsService.getAll();
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Ayarlar yüklenemedi');
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettings: (state, action: PayloadAction<Record<string, string>>) => {
            state.data = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
