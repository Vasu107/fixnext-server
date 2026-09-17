const bcrypt = require('bcrypt');
const prisma = require('../../config/db');
const { generateToken } = require('../../utils/jwt');

const SALT_ROUNDS = 10;

const registerCustomer = async (data) => {
    const { email, phone, password, name } = data;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email already registered');
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = await prisma.user.create({
        data: {
            email,
            phone,
            passwordHash,
            name,
            role: 'customer'
        }
    });
    
    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

const registerProvider = async (data) => {
    const { email, phone, password, name, bio, experience, city, categories } = data;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email already registered');
    
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const user = await prisma.user.create({
        data: {
            email,
            phone,
            passwordHash,
            name,
            role: 'provider',
            providerProfile: {
                create: {
                    bio,
                    experience,
                    city,
                    categories: {
                        create: categories.map(cat => ({ categoryId: cat }))
                    }
                }
            }
        },
        include: {
            providerProfile: {
                include: { categories: true }
            }
        }
    });
    
    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

const login = async (data) => {
    const { email, password } = data;
    
    // Check for hardcoded admin login first (no DB record needed)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fixnext.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
    
    if (email === adminEmail && password === adminPassword) {
        const token = generateToken({ userId: 'admin-1', role: 'admin', email: adminEmail });
        return { user: { id: 'admin-1', name: 'Admin', email: adminEmail, role: 'admin' }, token };
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid credentials');
    
    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
};

const getMe = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            providerProfile: {
                include: { categories: true }
            }
        }
    });
    
    if (!user) throw new Error('User not found');
    
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

module.exports = {
    registerCustomer,
    registerProvider,
    login,
    getMe
};
