import { Booking, Car, Branch, User } from '@prisma/client';

export interface BookingWithRelations extends Booking {
    car: Car;
    pickupBranch: Branch;
    dropoffBranch: Branch;
    user?: User | null;
}

export interface DayAvailability {
    date: string; // YYYY-MM-DD
    status: 'available' | 'booked';
    bookingId?: string;
}

export interface DateRange {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
    status: 'available' | 'booked';
    bookingId?: string;
}

export interface AvailabilityResponse {
    carId: string;
    from: string;
    to: string;
    calendar: DayAvailability[];
    ranges: DateRange[];
}
