import { Request, Response, NextFunction } from 'express';
import * as campaignService from './campaigns.service.js';
import { ApiResponse } from '../../lib/api-response.js';
import { auditService } from '../audit/audit.service.js';

export async function listPublicCampaigns(_req: Request, res: Response, next: NextFunction) {
    try {
        const campaigns = await campaignService.listActiveCampaigns();
        ApiResponse.success(res, campaigns);
    } catch (error) {
        next(error);
    }
}

export async function listAllCampaigns(_req: Request, res: Response, next: NextFunction) {
    try {
        const campaigns = await campaignService.listAllCampaigns();
        ApiResponse.success(res, campaigns);
    } catch (error) {
        next(error);
    }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
        const campaign = await campaignService.createCampaign(req.body);

        await auditService.logAction(req.user?.userId, 'CREATE_CAMPAIGN', { campaignId: campaign.id, title: campaign.title }, req);

        ApiResponse.created(res, campaign, 'Campaign created successfully');
    } catch (error) {
        next(error);
    }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!id) throw new Error('ID is required');
        const campaign = await campaignService.updateCampaign(id, req.body);

        await auditService.logAction(req.user?.userId, 'UPDATE_CAMPAIGN', { campaignId: id, title: campaign.title, updates: req.body }, req);

        ApiResponse.success(res, campaign, 'Campaign updated successfully');
    } catch (error) {
        next(error);
    }
}

export async function deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!id) throw new Error('ID is required');
        const campaign = await campaignService.deleteCampaign(id);

        await auditService.logAction(req.user?.userId, 'DELETE_CAMPAIGN', { campaignId: id, title: campaign.title }, req);

        ApiResponse.success(res, null, 'Campaign deleted successfully');
    } catch (error) {
        next(error);
    }
}
