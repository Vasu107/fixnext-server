const bcrypt = require('bcrypt');
const prisma = require('../../config/db');
const { generateToken } = require('../../utils/jwt');
const { OAuth2Client } = require('google-auth-library');

const SALT_ROUNDS = 10;

// ─── Google OAuth ────────────────────────────────────────────────────────────

const googleAuth = async ({ idToken }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured on the server');

    const client = new OAuth2Client(clientId);

    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: clientId,
        });
        payload = ticket.getPayload();
    } catch (err) {
        throw new Error('Invalid Google token');
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    if (!email) throw new Error('Google account has no email');

    // Try finding existing user by googleId first, then by email (linking existing account)
    let user = await prisma.user.findFirst({
        where: {
            OR: [
                { googleId },
                { email, authProvider: 'local' }, // existing local account with same email
            ],
        },
    });

    if (user) {
        // Update googleId if this was a local account being linked
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId, authProvider: 'google', avatar },
            });
        }
    } else {
        // Create a new Google-authenticated customer
        user = await prisma.user.create({
            data: {
                email,
                name: name || email.split('@')[0],
                googleId,
                avatar,
                authProvider: 'google',
                role: 'customer',
                // phone and passwordHash are optional — Google users don't have them
            },
        });
    }

    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            phone: user.phone,
            authProvider: user.authProvider,
        },
        token,
    };
};

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
    
    // Prevent password login for Google-only accounts
    if (user.authProvider === 'google' || !user.passwordHash) {
        throw new Error('This account uses Google Sign-In. Please use "Continue with Google".');
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid credentials');
    
    const token = generateToken({ userId: user.id, role: user.role, email: user.email });
    return { user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }, token };
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
    googleAuth,
    getMe
};
