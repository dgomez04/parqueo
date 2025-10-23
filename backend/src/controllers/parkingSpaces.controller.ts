import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const getAllParkingSpaces = async (req: AuthRequest, res: Response) => {
  try {
    const spaces = await prisma.parkingSpace.findMany({
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
    const { spaceNumber } = req.body;

    if (!spaceNumber) {
      return res.status(400).json({ error: 'Space number is required' });
    }

    const space = await prisma.parkingSpace.create({
      data: { spaceNumber },
    });

    res.status(201).json(space);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Space number already exists' });
    }
    console.error('Create parking space error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateParkingSpace = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { spaceNumber, isOccupied } = req.body;

    const space = await prisma.parkingSpace.update({
      where: { id: parseInt(id) },
      data: { spaceNumber, isOccupied },
    });

    res.json(space);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Parking space not found' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Space number already exists' });
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
    const spaces = await prisma.parkingSpace.findMany({
      where: { isOccupied: false },
      orderBy: { spaceNumber: 'asc' },
    });
    res.json(spaces);
  } catch (error) {
    console.error('Get available spaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
