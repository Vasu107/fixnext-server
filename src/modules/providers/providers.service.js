const prisma = require('../../config/db');

const getProvidersByCategory = async (categoryId) => {
    const providers = await prisma.providerProfile.findMany({
        where: {
            categories: {
                some: {
                    categoryId: categoryId
                }
            },
            verified: true // Only show verified providers to customers
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            },
            categories: true
        }
    });

    return providers.map(p => ({
        id: p.userId,
        catId: categoryId,
        name: p.user.name,
        specialty: p.categories.map(c => c.categoryId).join(', '),
        rating: 4.8, // Default rating for now
        reviews: 0,
        experience: p.experience,
        startingAt: '₹199/hr',
        verified: p.verified,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        about: p.bio
    }));
};

const getProviderById = async (providerId) => {
    const provider = await prisma.providerProfile.findUnique({
        where: { userId: providerId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                }
            },
            categories: true
        }
    });

    if (!provider) throw new Error('Provider not found');

    return {
        id: provider.userId,
        name: provider.user.name,
        specialty: provider.categories.map(c => c.categoryId).join(', '),
        rating: 4.8,
        reviews: 0,
        experience: provider.experience,
        startingAt: '₹199/hr',
        verified: provider.verified,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
        about: provider.bio,
        city: provider.city,
        categories: provider.categories
    };
};

const updateProfile = async (providerId, data) => {
    const { bio, experience, city } = data;
    
    const updated = await prisma.providerProfile.update({
        where: { userId: providerId },
        data: {
            bio,
            experience,
            city
        }
    });
    
    return updated;
};

module.exports = {
    getProvidersByCategory,
    getProviderById,
    updateProfile
};
