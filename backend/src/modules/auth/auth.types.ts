import { User, UserRole } from '@prisma/client';

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        whatsappEnabled?: boolean;
    };
    token: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;
