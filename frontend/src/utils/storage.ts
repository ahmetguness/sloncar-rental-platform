
// Utility to handle storage operations (localStorage vs sessionStorage)
// This is used to support "Remember Me" functionality where:
// - Remember Me = true -> localStorage (persists across browser restarts)
// - Remember Me = false -> sessionStorage (clears when browser closes)

// Standalone functions to avoid `this` context issues or circular references
const log = (msg: string, ...args: any[]) => {
    console.log(`[Storage ${new Date().toISOString().split('T')[1]}] ${msg}`, ...args);
};

const getToken = (): string | null => {
    const local = localStorage.getItem('token');
    const session = sessionStorage.getItem('token');
    // Debug
    // if (local) log('Found token in localStorage');
    // if (session) log('Found token in sessionStorage');
    return local || session;
};

const getUser = (): any | null => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Failed to parse user from storage', e);
        return null;
    }
};

const clearAuth = () => {
    log('Clearing auth');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
};

const parseJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const setAuth = (token: string, user: any, rememberMe: boolean) => {
    log(`Setting auth. RememberMe: ${rememberMe}`);

    // Check token expiration
    const decoded = parseJwt(token);
    if (decoded && decoded.exp) {
        const expDate = new Date(decoded.exp * 1000);
        const now = new Date();
        const daysUntilExp = (expDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        log(`Token Expires: ${expDate.toLocaleString()} (~${daysUntilExp.toFixed(2)} days)`);
    } else {
        log('Could not parse token expiration');
    }

    const userStr = JSON.stringify(user);

    // Clear potentially conflicting old state
    clearAuth();

    if (rememberMe) {
        log('Saving to localStorage');
        localStorage.setItem('token', token);
        localStorage.setItem('user', userStr);
    } else {
        log('Saving to sessionStorage');
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', userStr);
    }
};

const setUser = (user: any) => {
    const userStr = JSON.stringify(user);
    if (localStorage.getItem('user')) {
        localStorage.setItem('user', userStr);
    } else {
        sessionStorage.setItem('user', userStr);
    }
};

const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;

    // Optional: Check if expired right now
    const decoded = parseJwt(token);
    if (decoded && decoded.exp) {
        const isExpired = decoded.exp * 1000 < Date.now();
        if (isExpired) {
            log('Token is expired, clearing auth');
            clearAuth();
            return false;
        }
    }
    return true;
};

export const storage = {
    getToken,
    getUser,
    setAuth,
    setUser,
    clearAuth,
    isAuthenticated
};
