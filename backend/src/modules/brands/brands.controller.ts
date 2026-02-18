import { Request, Response, NextFunction } from 'express';
import * as brandsService from './brands.service.js';
import { cacheService } from '../../lib/cache.service.js';

export async function listBrands(_req: Request, res: Response, next: NextFunction) {
    try {
        const cacheKey = 'brands:public';
        const cached = cacheService.get(cacheKey);

        if (cached) {
            res.json(cached);
            return;
        }

        const brands = await brandsService.listBrands();
        cacheService.set(cacheKey, brands, 3600); // 1 hour
        res.json(brands);
    } catch (error) {
        next(error);
    }
}

export async function listAllBrands(_req: Request, res: Response, next: NextFunction) {
    try {
        const brands = await brandsService.listAllBrands();
        res.json(brands);
    } catch (error) {
        next(error);
    }
}

