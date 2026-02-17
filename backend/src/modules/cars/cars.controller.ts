import { Request, Response, NextFunction } from 'express';
import * as carsService from './cars.service.js';
import { auditService } from '../audit/audit.service.js';
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

        await auditService.logAction(req.user?.userId, 'CREATE_CAR', { carId: car.id, brand: car.brand, model: car.model }, req);

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

        await auditService.logAction(req.user?.userId, 'UPDATE_CAR', {
            carId: car.id,
            brand: car.brand,
            model: car.model,
            plate: car.plateNumber,
            updates: req.body
        }, req);

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
        const car = await carsService.deleteCar(req.params.id!) as any;

        await auditService.logAction(req.user?.userId, 'DELETE_CAR', { carId: req.params.id, brand: car.brand, model: car.model, plate: car.plateNumber }, req);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
