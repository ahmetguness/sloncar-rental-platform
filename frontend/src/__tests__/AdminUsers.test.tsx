import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import { AdminUsers } from '../pages/AdminUsers';
import { adminService } from '../services/api';
import { storage } from '../utils/storage';

// Mock services/utils
vi.mock('../services/api', () => ({
    adminService: {
        getUsers: vi.fn(),
        deleteUser: vi.fn(),
    },
}));

vi.mock('../components/ui/Toast', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

describe('AdminUsers', () => {
    const mockUsers = {
        success: true,
        data: [
            { id: '1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', phone: '5321112233' },
            { id: '2', name: 'Staff User', email: 'staff@test.com', role: 'STAFF', phone: '5321112244' },
        ],
        pagination: { total: 2, totalPages: 1 }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(storage.getUser).mockReturnValue({ id: '1', role: 'ADMIN' } as any);
        vi.mocked(adminService.getUsers).mockResolvedValue(mockUsers as any);
    });

    it('renders user list correctly', async () => {
        render(<AdminUsers />);
        
        expect(screen.getByText('Kullanıcı Yönetimi')).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Admin User')).toBeInTheDocument();
            expect(screen.getByText('Staff User')).toBeInTheDocument();
        });
    });

    it('shows loading state while fetching', () => {
        vi.mocked(adminService.getUsers).mockReturnValue(new Promise(() => {})); 
        const { container } = render(<AdminUsers />);
        const loader = container.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });

    it('handles search input', async () => {
        render(<AdminUsers />);
        
        const searchInput = screen.getByPlaceholderText(/ara.../i);
        fireEvent.change(searchInput, { target: { value: 'Staff' } });
        
        await waitFor(() => {
            expect(adminService.getUsers).toHaveBeenCalledWith(expect.objectContaining({
                search: 'Staff'
            }));
        });
    });

    it('displays "no users found" when data is empty', async () => {
        vi.mocked(adminService.getUsers).mockResolvedValue({ success: true, data: [], pagination: { total: 0, totalPages: 0 } } as any);
        render(<AdminUsers />);
        
        await waitFor(() => {
            expect(screen.getByText('Kullanıcı bulunamadı')).toBeInTheDocument();
        });
    });

    it('restricts access for non-admin users', () => {
        vi.mocked(storage.getUser).mockReturnValue({ id: '2', role: 'STAFF' } as any);
        const { container } = render(<AdminUsers />);
        
        expect(container.firstChild).toBeNull();
    });
});
