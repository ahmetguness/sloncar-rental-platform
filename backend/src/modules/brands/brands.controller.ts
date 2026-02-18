import { Request, Response, NextFunction } from 'express';
import * as brandsService from './brands.service.js';

export async function listBrands(_req: Request, res: Response, next: NextFunction) {
    try {
        const brands = await brandsService.listBrands();
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

