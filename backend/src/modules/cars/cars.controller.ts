import { Request, Response, NextFunction } from 'express';
import * as carsService from './cars.service.js';
import { CreateCarInput, UpdateCarInput, CarQueryInput, carQuerySchema } from './cars.validators.js';

export async function listCars(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Validate query parameters strictly
        const query = carQuerySchema.parse(req.query);
        const result = await carsService.listCars(query);
        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        next(error);
    }
}

export async function getCarById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const car = await carsService.getCarById(req.params.id!);
        res.json({
            success: true,
            data: car,
        });
    } catch (error) {
        next(error);
    }
}

export async function createCar(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const car = await carsService.createCar(req.body as CreateCarInput);
        res.status(201).json({
            success: true,
            data: car,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateCar(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const car = await carsService.updateCar(req.params.id!, req.body as UpdateCarInput);
        res.json({
            success: true,
            data: car,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteCar(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        await carsService.deleteCar(req.params.id!);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
