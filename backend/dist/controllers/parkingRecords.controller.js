"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveRecords = exports.createExit = exports.createEntry = exports.getParkingRecordById = exports.getAllParkingRecords = void 0;
const db_1 = __importDefault(require("../db"));
const getAllParkingRecords = async (req, res) => {
    try {
        const records = await db_1.default.parkingRecord.findMany({
            include: {
                vehicle: true,
                parkingSpace: true,
            },
            orderBy: { entryTime: 'desc' },
        });
        res.json(records);
    }
    catch (error) {
        console.error('Get parking records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllParkingRecords = getAllParkingRecords;
const getParkingRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await db_1.default.parkingRecord.findUnique({
            where: { id: parseInt(id) },
            include: {
                vehicle: true,
                parkingSpace: true,
            },
        });
        if (!record) {
            return res.status(404).json({ error: 'Parking record not found' });
        }
        res.json(record);
    }
    catch (error) {
        console.error('Get parking record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getParkingRecordById = getParkingRecordById;
const createEntry = async (req, res) => {
    try {
        const { vehicleId, parkingSpaceId, preferHandicap } = req.body;
        if (!vehicleId) {
            return res.status(400).json({ error: 'Vehicle ID is required' });
        }
        // Check if vehicle exists
        const vehicle = await db_1.default.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        // Check if vehicle already has an active parking record
        const activeRecord = await db_1.default.parkingRecord.findFirst({
            where: {
                vehicleId,
                exitTime: null,
            },
        });
        if (activeRecord) {
            return res.status(409).json({ error: 'Vehicle is already parked' });
        }
        let assignedSpace;
        // If parkingSpaceId is provided, use it (for manual override or preferHandicap=false case)
        if (parkingSpaceId) {
            const space = await db_1.default.parkingSpace.findUnique({ where: { id: parkingSpaceId } });
            if (!space) {
                return res.status(404).json({ error: 'Parking space not found' });
            }
            if (space.isOccupied) {
                return res.status(409).json({ error: 'Parking space is already occupied' });
            }
            assignedSpace = space;
        }
        else {
            // Auto-assign based on vehicle type and handicap needs
            const requiresHandicap = vehicle.requiresHandicapSpace && preferHandicap !== false;
            let compatibleSpaceTypes = [];
            if (requiresHandicap) {
                // If vehicle requires handicap and user prefers handicap space, only look for handicap
                compatibleSpaceTypes = ['HANDICAP'];
            }
            else if (vehicle.type === 'MOTORCYCLE') {
                // Motorcycles can park in motorcycle or handicap spaces
                compatibleSpaceTypes = ['MOTORCYCLE', 'HANDICAP'];
            }
            else {
                // Cars can park in car or handicap spaces
                compatibleSpaceTypes = ['CAR', 'HANDICAP'];
            }
            // Find first available compatible space
            assignedSpace = await db_1.default.parkingSpace.findFirst({
                where: {
                    isOccupied: false,
                    spaceType: { in: compatibleSpaceTypes },
                },
                orderBy: { spaceNumber: 'asc' },
            });
            if (!assignedSpace) {
                if (requiresHandicap) {
                    // No handicap spaces available, inform user
                    return res.status(404).json({
                        error: 'No handicap spaces available',
                        code: 'NO_HANDICAP_SPACES',
                        message: 'No hay espacios para discapacitados disponibles. ¿Desea estacionar en un espacio regular?',
                    });
                }
                return res.status(404).json({ error: 'No compatible parking spaces available' });
            }
        }
        // Create parking record and update space
        const record = await db_1.default.$transaction(async (tx) => {
            const newRecord = await tx.parkingRecord.create({
                data: { vehicleId, parkingSpaceId: assignedSpace.id },
                include: {
                    vehicle: true,
                    parkingSpace: {
                        include: {
                            parking: true,
                        },
                    },
                },
            });
            await tx.parkingSpace.update({
                where: { id: assignedSpace.id },
                data: { isOccupied: true },
            });
            return newRecord;
        });
        res.status(201).json(record);
    }
    catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createEntry = createEntry;
const createExit = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await db_1.default.parkingRecord.findUnique({
            where: { id: parseInt(id) },
        });
        if (!record) {
            return res.status(404).json({ error: 'Parking record not found' });
        }
        if (record.exitTime) {
            return res.status(409).json({ error: 'Vehicle has already exited' });
        }
        // Update parking record and free up space
        const updatedRecord = await db_1.default.$transaction(async (tx) => {
            const updated = await tx.parkingRecord.update({
                where: { id: parseInt(id) },
                data: { exitTime: new Date() },
                include: {
                    vehicle: true,
                    parkingSpace: true,
                },
            });
            await tx.parkingSpace.update({
                where: { id: record.parkingSpaceId },
                data: { isOccupied: false },
            });
            return updated;
        });
        res.json(updatedRecord);
    }
    catch (error) {
        console.error('Create exit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createExit = createExit;
const getActiveRecords = async (req, res) => {
    try {
        const records = await db_1.default.parkingRecord.findMany({
            where: { exitTime: null },
            include: {
                vehicle: true,
                parkingSpace: true,
            },
            orderBy: { entryTime: 'desc' },
        });
        res.json(records);
    }
    catch (error) {
        console.error('Get active records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getActiveRecords = getActiveRecords;
