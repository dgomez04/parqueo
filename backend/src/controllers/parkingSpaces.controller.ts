import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const getAllParkingSpaces = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingId } = req.query;

    const where = parkingId ? { parkingId: parseInt(parkingId as string) } : {};

    const spaces = await prisma.parkingSpace.findMany({
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
  } catch (error) {
    console.error('Get parking spaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getParkingSpaceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const space = await prisma.parkingSpace.findUnique({
      where: { id: parseInt(id) },
    });

    if (!space) {
      return res.status(404).json({ error: 'Parking space not found' });
    }

    res.json(space);
  } catch (error) {
    console.error('Get parking space error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { spaceNumber, parkingId, spaceType } = req.body;

    if (!spaceNumber) {
      return res.status(400).json({ error: 'Space number is required' });
    }

    if (!parkingId) {
      return res.status(400).json({ error: 'Parking ID is required' });
    }

    // Verify parking exists
    const parking = await prisma.parking.findUnique({
      where: { id: parkingId },
    });

    if (!parking) {
      return res.status(404).json({ error: 'Parking not found' });
    }

    const space = await prisma.parkingSpace.create({
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
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Space number already exists in this parking' });
    }
    console.error('Create parking space error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { spaceNumber, isOccupied, spaceType } = req.body;

    const updateData: any = {};
    if (spaceNumber !== undefined) updateData.spaceNumber = spaceNumber;
    if (isOccupied !== undefined) updateData.isOccupied = isOccupied;
    if (spaceType !== undefined) updateData.spaceType = spaceType;
    // Note: parkingId is intentionally excluded - physical spaces cannot move between parkings

    const space = await prisma.parkingSpace.update({
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
  } catch (error: any) {
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

export const deleteParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.parkingSpace.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parking space not found' });
    }
    console.error('Delete parking space error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailableSpaces = async (req: AuthRequest, res: Response) => {
  try {
    const { parkingId, spaceType } = req.query;

    const where: any = { isOccupied: false };
    if (parkingId) where.parkingId = parseInt(parkingId as string);
    if (spaceType) where.spaceType = spaceType;

    const spaces = await prisma.parkingSpace.findMany({
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
  } catch (error) {
    console.error('Get available spaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
