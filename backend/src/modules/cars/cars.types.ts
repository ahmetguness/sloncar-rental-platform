import { Car, Branch } from '@prisma/client';

export interface CarWithBranch extends Car {
    branch: Branch;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
