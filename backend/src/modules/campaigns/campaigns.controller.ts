import { Request, Response, NextFunction } from 'express';
import * as campaignService from './campaigns.service.js';
import { ApiResponse } from '../../lib/api-response.js';

export async function listPublicCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
        const campaigns = await campaignService.listActiveCampaigns();
        ApiResponse.success(res, campaigns);
    } catch (error) {
        next(error);
    }
}

export async function listAllCampaigns(req: Request, res: Response, next: NextFunction) {
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
        ApiResponse.success(res, campaign, 'Campaign updated successfully');
    } catch (error) {
        next(error);
    }
}

export async function deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (!id) throw new Error('ID is required');
        await campaignService.deleteCampaign(id);
        ApiResponse.success(res, null, 'Campaign deleted successfully');
    } catch (error) {
        next(error);
    }
}
