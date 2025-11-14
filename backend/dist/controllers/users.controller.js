"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../db"));
const getAllUsers = async (req, res) => {
    try {
        const users = await db_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                dateOfBirth: true,
                identificationNumber: true,
                role: true,
                isFirstLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await db_1.default.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                name: true,
                dateOfBirth: true,
                identificationNumber: true,
                role: true,
                isFirstLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { email, name, dateOfBirth, identificationNumber, role } = req.body;
        if (!email || !name || !dateOfBirth || !identificationNumber || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Hash the default password "Ulacit123"
        const hashedPassword = await bcryptjs_1.default.hash('Ulacit123', 10);
        const user = await db_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                dateOfBirth: new Date(dateOfBirth),
                identificationNumber,
                role,
                isFirstLogin: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                dateOfBirth: true,
                identificationNumber: true,
                role: true,
                isFirstLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email or identification number already exists' });
        }
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, dateOfBirth, identificationNumber, role } = req.body;
        const user = await db_1.default.user.update({
            where: { id: parseInt(id) },
            data: {
                email,
                name,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                identificationNumber,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                dateOfBirth: true,
                identificationNumber: true,
                role: true,
                isFirstLogin: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email or identification number already exists' });
        }
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.user.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found' });
        }
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteUser = deleteUser;
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }
        const user = await db_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Check if new password is the default password
        if (newPassword === 'Ulacit123') {
            return res.status(400).json({ error: 'Cannot use the default password. Please choose a different password.' });
        }
        // Check against password history
        const passwordHistory = user.passwordHistory ? user.passwordHistory.split('|') : [];
        for (const oldPasswordHash of passwordHistory) {
            const isOldPassword = await bcryptjs_1.default.compare(newPassword, oldPasswordHash);
            if (isOldPassword) {
                return res.status(400).json({ error: 'Cannot reuse a previous password. Please choose a different password.' });
            }
        }
        // Also check against current password (shouldn't be the same as current)
        const isSameAsCurrent = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSameAsCurrent) {
            return res.status(400).json({ error: 'New password must be different from current password.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        // Update password history (keep last 5 passwords)
        const updatedHistory = [user.password, ...passwordHistory].slice(0, 5).join('|');
        await db_1.default.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                passwordHistory: updatedHistory,
                isFirstLogin: false,
            },
        });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.changePassword = changePassword;
