"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentOccupation = void 0;
const db_1 = __importDefault(require("../db"));
const getCurrentOccupation = async (req, res) => {
    try {
        const totalSpaces = await db_1.default.parkingSpace.count();
        const occupiedSpaces = await db_1.default.parkingSpace.count({
            where: { isOccupied: true },
        });
        const availableSpaces = totalSpaces - occupiedSpaces;
        const occupationRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;
        const activeRecords = await db_1.default.parkingRecord.findMany({
            where: { exitTime: null },
            include: {
                vehicle: true,
                parkingSpace: true,
            },
        });
        res.json({
            totalSpaces,
            occupiedSpaces,
            availableSpaces,
            occupationRate: Math.round(occupationRate * 100) / 100,
            activeParking: activeRecords,
        });
    }
    catch (error) {
        console.error('Get current occupation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getCurrentOccupation = getCurrentOccupation;
