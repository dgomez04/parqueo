import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const getAllParkings = async (req: AuthRequest, res: Response) => {
  try {
    const parkings = await prisma.parking.findMany({
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
  } catch (error) {
    console.error('Get parkings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getParkingById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parking = await prisma.parking.findUnique({
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
  } catch (error) {
    console.error('Get parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createParking = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Parking name is required' });
    }

    const parking = await prisma.parking.create({
      data: { name: name.trim() },
    });

    res.status(201).json(parking);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Parking name already exists' });
    }
    console.error('Create parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateParking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Parking name is required' });
    }

    const parking = await prisma.parking.update({
      where: { id: parseInt(id) },
      data: { name: name.trim() },
    });

    res.json(parking);
  } catch (error: any) {
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

export const deleteParking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if parking has any spaces
    const parking = await prisma.parking.findUnique({
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

    await prisma.parking.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parking not found' });
    }
    console.error('Delete parking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
