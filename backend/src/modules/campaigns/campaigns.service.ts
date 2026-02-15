import { prisma } from '../../lib/prisma.js';

export async function listActiveCampaigns() {
    return prisma.campaign.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
    });
}

export async function listAllCampaigns() {
    return prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function createCampaign(data: {
    title: string;
    description: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    tag?: string;
    requiredCondition?: string;
    order?: number;
    isActive?: boolean;
}) {
    return prisma.campaign.create({
        data,
    });
}

export async function updateCampaign(id: string, data: {
    title?: string;
    description?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    tag?: string;
    requiredCondition?: string;
    order?: number;
    isActive?: boolean;
}) {
    return prisma.campaign.update({
        where: { id },
        data,
    });
}

import cloudinary from '../../lib/cloudinary.js';

export async function deleteCampaign(id: string) {
    const campaign = await prisma.campaign.findUnique({
        where: { id },
    });

    if (campaign && campaign.imageUrl) {
        try {
            // Extract public_id from URL
            const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/;
            const match = campaign.imageUrl.match(regex);

            if (match && match[1]) {
                const publicId = match[1];
                await cloudinary.uploader.destroy(publicId);
            }
        } catch (error) {
            console.error(`[Cloudinary] Failed to delete image ${campaign.imageUrl}:`, error);
        }
    }

    return prisma.campaign.delete({
        where: { id },
    });
}
