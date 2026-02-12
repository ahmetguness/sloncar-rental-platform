import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}

export function signToken(payload: JwtPayload, options?: { expiresIn?: string }): string {
    // Cast expiresIn to proper type - it's a string like '7d' or '24h'
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: (options?.expiresIn || env.JWT_EXPIRES_IN) as jwt.SignOptions['expiresIn'],
    });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
    try {
        return jwt.decode(token) as JwtPayload;
    } catch {
        return null;
    }
}
