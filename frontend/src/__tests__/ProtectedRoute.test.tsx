import { describe, it, expect, vi } from 'vitest';
import { render } from '../test/test-utils';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAppSelector } from '../store/hooks';

vi.mock('../store/hooks', () => ({
    useAppSelector: vi.fn(),
}));

describe('ProtectedRoute', () => {
    it('redirects to login when not authenticated', () => {
        vi.mocked(useAppSelector).mockReturnValue({ isAuthenticated: false, user: null });

        const { getByText, queryByText } = render(
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/protected" element={<div>Protected Content</div>} />
                </Route>
                <Route path="/admin/login" element={<div>Login Page</div>} />
            </Routes>,
            { initialEntries: ['/protected'] }
        );

        expect(queryByText('Protected Content')).not.toBeInTheDocument();
        expect(getByText('Login Page')).toBeInTheDocument();
    });

    it('renders outlet when authenticated and no roles required', () => {
        vi.mocked(useAppSelector).mockReturnValue({ isAuthenticated: true, user: { role: 'user' } });

        const { getByText } = render(
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/protected" element={<div>Protected Content</div>} />
                </Route>
            </Routes>,
            { initialEntries: ['/protected'] }
        );

        expect(getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to root when role is not allowed', () => {
        vi.mocked(useAppSelector).mockReturnValue({ isAuthenticated: true, user: { role: 'user' } });

        const { getByText, queryByText } = render(
            <Routes>
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/protected" element={<div>Protected Content</div>} />
                </Route>
                <Route path="/" element={<div>Root Page</div>} />
            </Routes>,
            { initialEntries: ['/protected'] }
        );

        expect(queryByText('Protected Content')).not.toBeInTheDocument();
        expect(getByText('Root Page')).toBeInTheDocument();
    });

    it('renders outlet when role is allowed', () => {
        vi.mocked(useAppSelector).mockReturnValue({ isAuthenticated: true, user: { role: 'admin' } });

        const { getByText } = render(
            <Routes>
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/protected" element={<div>Protected Content</div>} />
                </Route>
            </Routes>,
            { initialEntries: ['/protected'] }
        );

        expect(getByText('Protected Content')).toBeInTheDocument();
    });
});
