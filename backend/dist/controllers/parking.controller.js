"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParking = exports.updateParking = exports.createParking = exports.getParkingById = exports.getAllParkings = void 0;
const db_1 = __importDefault(require("../db"));
const getAllParkings = async (req, res) => {
    try {
        const parkings = await db_1.default.parking.findMany({
            include: {
                parkingSpaces: {
                    select: {
                        id: true,
                        isOccupied: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        // Add space counts to each parking
        const parkingsWithCounts = parkings.map((parking) => ({
            id: parking.id,
            name: parking.name,
            createdAt: parking.createdAt,
            updatedAt: parking.updatedAt,
            totalSpaces: parking.parkingSpaces.length,
            occupiedSpaces: parking.parkingSpaces.filter((s) => s.isOccupied).length,
            availableSpaces: parking.parkingSpaces.filter((s) => !s.isOccupied).length,
        }));
        res.json(parkingsWithCounts);
    }
    catch (error) {
        console.error('Get parkings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllParkings = getAllParkings;
const getParkingById = async (req, res) => {
    try {
        const { id } = req.params;
        const parking = await db_1.default.parking.findUnique({
            where: { id: parseInt(id) },
            include: {
                parkingSpaces: {
                    orderBy: { spaceNumber: 'asc' },
                },
            },
        });
        if (!parking) {
            return res.status(404).json({ error: 'Parking not found' });
        }
        res.json(parking);
    }
    catch (error) {
        console.error('Get parking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getParkingById = getParkingById;
const createParking = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Parking name is required' });
        }
        const parking = await db_1.default.parking.create({
            data: { name: name.trim() },
        });
        res.status(201).json(parking);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Parking name already exists' });
        }
        console.error('Create parking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createParking = createParking;
const updateParking = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Parking name is required' });
        }
        const parking = await db_1.default.parking.update({
            where: { id: parseInt(id) },
            data: { name: name.trim() },
        });
        res.json(parking);
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Parking not found' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Parking name already exists' });
        }
        console.error('Update parking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateParking = updateParking;
const deleteParking = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if parking has any spaces
        const parking = await db_1.default.parking.findUnique({
            where: { id: parseInt(id) },
            include: {
                parkingSpaces: true,
            },
        });
        if (!parking) {
            return res.status(404).json({ error: 'Parking not found' });
        }
        if (parking.parkingSpaces.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete parking with existing spaces. Delete all spaces first.',
            });
        }
        await db_1.default.parking.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Parking not found' });
        }
        console.error('Delete parking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteParking = deleteParking;
