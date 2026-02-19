import { Request, Response, NextFunction } from 'express';
import * as carsService from './cars.service.js';
import { auditService } from '../audit/audit.service.js';
import { CreateCarInput, UpdateCarInput, carQuerySchema } from './cars.validators.js';

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

        auditService.logAction(req.user?.userId, 'CREATE_CAR', { carId: car.id, brand: car.brand, model: car.model }, req);

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

        auditService.logAction(req.user?.userId, 'UPDATE_CAR', {
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
        const car = await carsService.deleteCar(req.params.id!);

        auditService.logAction(req.user?.userId, 'DELETE_CAR', { carId: req.params.id, brand: car.brand, model: car.model, plate: car.plateNumber }, req);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

export async function getUsedBrands(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { type } = req.query;
        // Cast type to CarType if provided, validation could be added but for now simplistic casting
        const brands = await carsService.getUsedBrands(type as any);
        res.json({
            success: true,
            data: brands,
        });
    } catch (error) {
        next(error);
    }
}
