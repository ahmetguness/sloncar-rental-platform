import { FranchiseApplication, FranchiseAuditLog, User } from '@prisma/client';
import { FranchiseDetails } from './franchise.validators.js';

export interface FranchiseApplicationWithUser extends FranchiseApplication {
    user: User;
    details: FranchiseDetails;
}

export interface FranchiseApplicationWithAudit extends FranchiseApplicationWithUser {
    auditLogs: FranchiseAuditLog[];
}

export interface AuditLogEntry {
    id: string;
    action: string;
    previousValue?: unknown;
    newValue?: unknown;
    performedBy: string;
    note?: string;
    createdAt: Date;
}
