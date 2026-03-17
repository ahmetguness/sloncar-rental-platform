import prisma from '../../lib/prisma.js';

export const settingsService = {
    /**
     * Get all global settings
     */
    getAll: async () => {
        const settings = await prisma.globalSetting.findMany();
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string>);
    },

    /**
     * Get a specific setting by key
     */
    getByKey: async (key: string, defaultValue: string = '') => {
        const setting = await prisma.globalSetting.findUnique({
            where: { key }
        });
        return setting?.value ?? defaultValue;
    },

    /**
     * Update or create a setting
     */
    upsert: async (key: string, value: string) => {
        return prisma.globalSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
    },

    /**
     * Batch update settings
     */
    updateBatch: async (settings: Record<string, string>) => {
        const updates = Object.entries(settings).map(([key, value]) => 
            prisma.globalSetting.upsert({
                where: { key },
                update: { value },
                create: { key, value }
            })
        );
        return Promise.all(updates);
    }
};
