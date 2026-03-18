import { MembershipType, User, UserRole } from '@prisma/client';

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        phone?: string | null;
        membershipType: MembershipType;
        tcNo?: string | null;
        companyName?: string | null;
        taxNumber?: string | null;
        taxOffice?: string | null;
        companyAddress?: string | null;
        whatsappEnabled?: boolean;
        emailEnabled?: boolean;
        emailBookingEnabled?: boolean;
        emailInsuranceEnabled?: boolean;
        emailCampaignEnabled?: boolean;
    };
    token: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;
