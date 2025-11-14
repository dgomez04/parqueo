"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicleById = exports.getAllVehicles = void 0;
const db_1 = __importDefault(require("../db"));
const getAllVehicles = async (req, res) => {
    try {
        const userRole = req.userRole;
        const userId = req.userId;
        // Students and Administrative Staff can only see their own vehicles
        const where = (userRole === 'STUDENT' || userRole === 'ADMINISTRATIVE_STAFF')
            ? { ownerId: userId }
            : {};
        const vehicles = await db_1.default.vehicle.findMany({
            where,
            include: { owner: { select: { id: true, name: true, email: true, role: true, dateOfBirth: true, identificationNumber: true } } },
        });
        res.json(vehicles);
    }
    catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllVehicles = getAllVehicles;
const getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await db_1.default.vehicle.findUnique({
            where: { id: parseInt(id) },
            include: { owner: { select: { id: true, name: true, email: true, role: true } } },
        });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    }
    catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getVehicleById = getVehicleById;
const createVehicle = async (req, res) => {
    try {
        const { licensePlate, color, brand, type, requiresHandicapSpace, ownerId } = req.body;
        if (!licensePlate || !color || !brand || !type || ownerId === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check if owner already has 2 vehicles (max allowed)
        const vehicleCount = await db_1.default.vehicle.count({
            where: { ownerId: parseInt(ownerId) },
        });
        if (vehicleCount >= 2) {
            return res.status(400).json({ error: 'Maximum of 2 vehicles per user allowed' });
        }
        const vehicle = await db_1.default.vehicle.create({
            data: {
                licensePlate,
                color,
                brand,
                type,
                requiresHandicapSpace: requiresHandicapSpace || false,
                ownerId: parseInt(ownerId),
            },
            include: { owner: { select: { id: true, name: true, email: true, role: true, dateOfBirth: true, identificationNumber: true } } },
        });
        res.status(201).json(vehicle);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'License plate already exists' });
        }
        console.error('Create vehicle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createVehicle = createVehicle;
const updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { licensePlate, color, brand, type, requiresHandicapSpace, ownerId } = req.body;
        const vehicle = await db_1.default.vehicle.update({
            where: { id: parseInt(id) },
            data: {
                licensePlate,
                color,
                brand,
                type,
                requiresHandicapSpace,
                ownerId: ownerId ? parseInt(ownerId) : undefined,
            },
            include: { owner: { select: { id: true, name: true, email: true, role: true, dateOfBirth: true, identificationNumber: true } } },
        });
        res.json(vehicle);
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'License plate already exists' });
        }
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateVehicle = updateVehicle;
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.vehicle.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        console.error('Delete vehicle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteVehicle = deleteVehicle;
