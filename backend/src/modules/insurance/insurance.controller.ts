import { Request, Response, NextFunction } from 'express';
import { insuranceService } from './insurance.service.js';

export const insuranceController = {
    getInsurances: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await insuranceService.getAllInsurances(req.query);
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    },

    createInsurance: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const insurance = await insuranceService.createInsurance(req.body);
            res.status(201).json({
                success: true,
                data: insurance,
            });
        } catch (error) {
            next(error);
        }
    },

    deleteInsurance: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.params.id) {
                throw new Error('ID is required');
            }
            await insuranceService.deleteInsurance(req.params.id);
            res.json({
                success: true,
                message: 'Sigorta kaydı silindi',
            });
        } catch (error) {
            next(error);
        }
    },

    exportInsurances: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const workbook = await insuranceService.exportInsurances();
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=' + 'Sigortalar.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    },
};
