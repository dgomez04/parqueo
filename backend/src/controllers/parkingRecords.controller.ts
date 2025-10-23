import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

export const getAllParkingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.parkingRecord.findMany({
      include: {
        vehicle: true,
        parkingSpace: true,
      },
      orderBy: { entryTime: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('Get parking records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getParkingRecordById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const record = await prisma.parkingRecord.findUnique({
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
  } catch (error) {
    console.error('Get parking record error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, parkingSpaceId } = req.body;

    if (!vehicleId || !parkingSpaceId) {
      return res.status(400).json({ error: 'Vehicle ID and Parking Space ID are required' });
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if parking space exists and is available
    const space = await prisma.parkingSpace.findUnique({ where: { id: parkingSpaceId } });
    if (!space) {
      return res.status(404).json({ error: 'Parking space not found' });
    }
    if (space.isOccupied) {
      return res.status(409).json({ error: 'Parking space is already occupied' });
    }

    // Check if vehicle already has an active parking record
    const activeRecord = await prisma.parkingRecord.findFirst({
      where: {
        vehicleId,
        exitTime: null,
      },
    });

    if (activeRecord) {
      return res.status(409).json({ error: 'Vehicle is already parked' });
    }

    // Create parking record and update space
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.parkingRecord.create({
        data: { vehicleId, parkingSpaceId },
        include: {
          vehicle: true,
          parkingSpace: true,
        },
      });

      await tx.parkingSpace.update({
        where: { id: parkingSpaceId },
        data: { isOccupied: true },
      });

      return newRecord;
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createExit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const record = await prisma.parkingRecord.findUnique({
      where: { id: parseInt(id) },
    });

    if (!record) {
      return res.status(404).json({ error: 'Parking record not found' });
    }

    if (record.exitTime) {
      return res.status(409).json({ error: 'Vehicle has already exited' });
    }

    // Update parking record and free up space
    const updatedRecord = await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    console.error('Create exit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActiveRecords = async (req: AuthRequest, res: Response) => {
  try {
    const records = await prisma.parkingRecord.findMany({
      where: { exitTime: null },
      include: {
        vehicle: true,
        parkingSpace: true,
      },
      orderBy: { entryTime: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('Get active records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
