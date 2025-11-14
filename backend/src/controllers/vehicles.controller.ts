import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const getAllVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.userRole;
    const userId = req.userId;

    // Students and Administrative Staff can only see their own vehicles
    const where = (userRole === 'STUDENT' || userRole === 'ADMINISTRATIVE_STAFF')
      ? { ownerId: userId }
      : {};

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { owner: { select: { id: true, name: true, email: true, role: true, dateOfBirth: true, identificationNumber: true } } },
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVehicleById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) },
      include: { owner: { select: { id: true, name: true, email: true, role: true } } },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { licensePlate, color, brand, type, requiresHandicapSpace, ownerId } = req.body;

    if (!licensePlate || !color || !brand || !type || ownerId === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if owner already has 2 vehicles (max allowed)
    const vehicleCount = await prisma.vehicle.count({
      where: { ownerId: parseInt(ownerId) },
    });

    if (vehicleCount >= 2) {
      return res.status(400).json({ error: 'Maximum of 2 vehicles per user allowed' });
    }

    const vehicle = await prisma.vehicle.create({
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
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'License plate already exists' });
    }
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { licensePlate, color, brand, type, requiresHandicapSpace, ownerId } = req.body;

    const vehicle = await prisma.vehicle.update({
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
  } catch (error: any) {
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

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.vehicle.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchVehicleByLicensePlate = async (req: AuthRequest, res: Response) => {
  try {
    const { licensePlate } = req.query;

    if (!licensePlate || typeof licensePlate !== 'string') {
      return res.status(400).json({ error: 'License plate is required' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: licensePlate.toUpperCase() },
      include: { owner: { select: { id: true, name: true, email: true, role: true, dateOfBirth: true, identificationNumber: true } } },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Search vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};