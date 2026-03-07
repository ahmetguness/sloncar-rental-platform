import { describe, it, expect, vi, beforeEach } from 'vitest';
import authReducer, { clearError, setUser, loginUser, logoutUser } from '../features/auth/authSlice';
import { storage } from '../utils/storage';

vi.mock('../services/api', () => ({
    adminService: {
        login: vi.fn(),
        logout: vi.fn(),
    },
}));

vi.mock('../utils/storage', () => ({
    storage: {
        getToken: vi.fn(() => null),
        getUser: vi.fn(() => null),
        setUser: vi.fn(),
        removeAuth: vi.fn(),
    },
}));

describe('authSlice', () => {
    const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        status: 'idle' as const,
        error: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return the initial state', () => {
        expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearError', () => {
        const stateWithError = { ...initialState, error: 'some error' };
        expect(authReducer(stateWithError, clearError())).toEqual(initialState);
    });

    it('should handle setUser', () => {
        const user = { id: 1, name: 'Test User', email: 'test@test.com' } as any;
        const nextState = authReducer(initialState, setUser(user));
        expect(nextState.user).toEqual(user);
        expect(storage.setUser).toHaveBeenCalledWith(user);
    });

    describe('loginUser async thunk', () => {
        it('should handle loginUser.pending', () => {
            const action = { type: loginUser.pending.type };
            const nextState = authReducer(initialState, action);
            expect(nextState.status).toBe('loading');
            expect(nextState.error).toBeNull();
        });

        it('should handle loginUser.fulfilled', () => {
            const payload = {
                user: { id: 1, name: 'Test User' },
                token: 'fake-token',
            };
            const action = { type: loginUser.fulfilled.type, payload };
            const nextState = authReducer(initialState, action);
            expect(nextState.status).toBe('succeeded');
            expect(nextState.isAuthenticated).toBe(true);
            expect(nextState.user).toEqual(payload.user);
            expect(nextState.token).toBe(payload.token);
        });

        it('should handle loginUser.rejected', () => {
            const action = { type: loginUser.rejected.type, payload: 'Wrong credentials' };
            const nextState = authReducer(initialState, action);
            expect(nextState.status).toBe('failed');
            expect(nextState.isAuthenticated).toBe(false);
            expect(nextState.error).toBe('Wrong credentials');
        });
    });

    describe('logoutUser async thunk', () => {
        it('should handle logoutUser.fulfilled', () => {
            const loggedInState = {
                ...initialState,
                user: { id: 1, name: 'Test User' } as any,
                token: 'token',
                isAuthenticated: true,
            };
            const action = { type: logoutUser.fulfilled.type };
            const nextState = authReducer(loggedInState, action);
            expect(nextState.user).toBeNull();
            expect(nextState.token).toBeNull();
            expect(nextState.isAuthenticated).toBe(false);
            expect(nextState.status).toBe('idle');
        });
    });
});
