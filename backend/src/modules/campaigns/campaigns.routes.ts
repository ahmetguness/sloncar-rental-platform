import { Router } from 'express';
import * as campaignController from './campaigns.controller.js';
import { authMiddleware } from '../../middlewares/auth.js';
import { adminGuard } from '../../middlewares/adminGuard.js';

// Public router (for homepage)
const router = Router();

router.get('/', campaignController.listPublicCampaigns);

// Admin router
export const adminCampaignRouter = Router();

adminCampaignRouter.use(authMiddleware);
adminCampaignRouter.use(adminGuard);

adminCampaignRouter.get('/', campaignController.listAllCampaigns);
adminCampaignRouter.post('/', campaignController.createCampaign);
adminCampaignRouter.patch('/:id', campaignController.updateCampaign);
adminCampaignRouter.delete('/:id', campaignController.deleteCampaign);

export default router;
