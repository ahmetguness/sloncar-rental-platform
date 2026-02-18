import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';
import { storage } from '../../utils/storage';
import type { User, AuthResponse } from '../../services/types';

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

// Hydrate initial state from storage
const initialToken = storage.getToken();
const initialUser = storage.getUser();

const initialState: AuthState = {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken,
    status: 'idle',
    error: null,
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: any, { rejectWithValue }) => {
        try {
            const data = await adminService.login(credentials);
            return data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Giriş yapılamadı');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        adminService.logout();
        return;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        // We can use this to manually set auth if needed (e.g. after profile update)
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            storage.setUser(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
                state.status = 'succeeded';
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                // storage.setAuth is already called in adminService.login, 
                // but strictly speaking, side effects should be here or in middleware.
                // For now, relying on the service's existing side effect is acceptable 
                // to avoid double-writing, but ideally we'd move storage calls here.
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.isAuthenticated = false;
                state.error = action.payload as string;
            })
            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.status = 'idle';
            });
    },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
