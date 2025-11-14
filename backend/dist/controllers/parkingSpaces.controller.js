"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSpaces = exports.deleteParkingSpace = exports.updateParkingSpace = exports.createParkingSpace = exports.getParkingSpaceById = exports.getAllParkingSpaces = void 0;
const db_1 = __importDefault(require("../db"));
const getAllParkingSpaces = async (req, res) => {
    try {
        const { parkingId } = req.query;
        const where = parkingId ? { parkingId: parseInt(parkingId) } : {};
        const spaces = await db_1.default.parkingSpace.findMany({
            where,
            include: {
                parking: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { spaceNumber: 'asc' },
        });
        res.json(spaces);
    }
    catch (error) {
        console.error('Get parking spaces error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllParkingSpaces = getAllParkingSpaces;
const getParkingSpaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const space = await db_1.default.parkingSpace.findUnique({
            where: { id: parseInt(id) },
        });
        if (!space) {
            return res.status(404).json({ error: 'Parking space not found' });
        }
        res.json(space);
    }
    catch (error) {
        console.error('Get parking space error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getParkingSpaceById = getParkingSpaceById;
const createParkingSpace = async (req, res) => {
    try {
        const { spaceNumber, parkingId, spaceType } = req.body;
        if (!spaceNumber) {
            return res.status(400).json({ error: 'Space number is required' });
        }
        if (!parkingId) {
            return res.status(400).json({ error: 'Parking ID is required' });
        }
        // Verify parking exists
        const parking = await db_1.default.parking.findUnique({
            where: { id: parkingId },
        });
        if (!parking) {
            return res.status(404).json({ error: 'Parking not found' });
        }
        const space = await db_1.default.parkingSpace.create({
            data: {
                spaceNumber,
                parkingId,
                spaceType: spaceType || 'CAR',
            },
            include: {
                parking: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(201).json(space);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Space number already exists in this parking' });
        }
        console.error('Create parking space error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createParkingSpace = createParkingSpace;
const updateParkingSpace = async (req, res) => {
    try {
        const { id } = req.params;
        const { spaceNumber, isOccupied, spaceType } = req.body;
        const updateData = {};
        if (spaceNumber !== undefined)
            updateData.spaceNumber = spaceNumber;
        if (isOccupied !== undefined)
            updateData.isOccupied = isOccupied;
        if (spaceType !== undefined)
            updateData.spaceType = spaceType;
        // Note: parkingId is intentionally excluded - physical spaces cannot move between parkings
        const space = await db_1.default.parkingSpace.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                parking: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.json(space);
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Parking space not found' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Space number already exists in this parking' });
        }
        console.error('Update parking space error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateParkingSpace = updateParkingSpace;
const deleteParkingSpace = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.parkingSpace.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Parking space not found' });
        }
        console.error('Delete parking space error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteParkingSpace = deleteParkingSpace;
const getAvailableSpaces = async (req, res) => {
    try {
        const { parkingId, spaceType } = req.query;
        const where = { isOccupied: false };
        if (parkingId)
            where.parkingId = parseInt(parkingId);
        if (spaceType)
            where.spaceType = spaceType;
        const spaces = await db_1.default.parkingSpace.findMany({
            where,
            include: {
                parking: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { spaceNumber: 'asc' },
        });
        res.json(spaces);
    }
    catch (error) {
        console.error('Get available spaces error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAvailableSpaces = getAvailableSpaces;
