import { Request, Response } from 'express';
import { settingsService } from './settings.service.js';

export const getSettings = async (_req: Request, res: Response) => {
    try {
        const settings = await settingsService.getAll();
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const settings = req.body;
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid settings data' });
        }

        await settingsService.updateBatch(settings);
        const updatedSettings = await settingsService.getAll();
        
        res.json({ success: true, data: updatedSettings });
    } catch (error) {
        console.error('Settings update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
};
