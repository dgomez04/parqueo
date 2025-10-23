import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const getCurrentOccupation = async (req: AuthRequest, res: Response) => {
  try {
    const totalSpaces = await prisma.parkingSpace.count();
    const occupiedSpaces = await prisma.parkingSpace.count({
      where: { isOccupied: true },
    });
    const availableSpaces = totalSpaces - occupiedSpaces;
    const occupationRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;

    const activeRecords = await prisma.parkingRecord.findMany({
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
  } catch (error) {
    console.error('Get current occupation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
