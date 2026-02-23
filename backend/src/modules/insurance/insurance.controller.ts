import { Request, Response, NextFunction } from 'express';
import { insuranceService } from './insurance.service.js';
import { auditService } from '../audit/audit.service.js';

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

            auditService.logAction(req.user?.userId, 'CREATE_INSURANCE', { insuranceId: insurance.id, policyNumber: insurance.policyNo, companyName: insurance.company }, req);

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
            const insurance = await insuranceService.deleteInsurance(req.params.id);

            auditService.logAction(req.user?.userId, 'DELETE_INSURANCE', { insuranceId: req.params.id, policyNumber: insurance.policyNo, companyName: insurance.company }, req);

            res.json({
                success: true,
                message: 'Sigorta kaydı silindi',
            });
        } catch (error) {
            next(error);
        }
    },

    exportInsurances: async (_req: Request, res: Response, next: NextFunction) => {
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

    importInsurances: async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, message: 'Lütfen bir Excel dosyası yükleyin' });
                return;
            }

            const result = await insuranceService.importInsurances(req.file.buffer);

            auditService.logAction(
                req.user?.userId,
                'IMPORT_INSURANCE',
                `Imported ${result.insertedCount} records, ${result.failedCount} failures`,
                req
            );

            res.json({
                success: true,
                data: result,
                message: `${result.insertedCount} kayıt başarıyla eklendi. ${result.failedCount} kayıt başarısız.`,
            });
        } catch (error) {
            next(error);
        }
    },

    searchClients: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { query } = req.query;
            const result = await insuranceService.searchClients(query as string);
            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },
    renew: async (req: Request, res: Response) => {
        try {
            const { startDate } = req.body;
            const result = await (insuranceService as any).renewInsurance(req.params.id as string, startDate);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },
};
