import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { storage } from '../utils/storage';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();
    const isAuthenticated = storage.isAuthenticated();
    const user = storage.getUser();

    console.log(`[ProtectedRoute] Auth Check: ${isAuthenticated ? 'Authenticated' : 'Not Authenticated'}, Path: ${location.pathname}`);

    if (!isAuthenticated) {
        // Redirect to login but save the attempted location
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Role based access control (optional expansion)
        return <Navigate to="/" replace />; // Or unauthorized page
    }

    return <Outlet />;
};
