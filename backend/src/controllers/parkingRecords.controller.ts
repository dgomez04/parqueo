import { Response } from 'express';
import prisma from '../db';
import { AuthRequest } from '../middleware/auth';

// Helper function to log access attempts
const logAccessAttempt = async (
  licensePlate: string,
  attemptType: 'ENTRY' | 'EXIT',
  success: boolean,
  failureReason: string | null,
  vehicleId: number | null,
  parkingId: number | null,
  securityOfficerId: number | null
) => {
  try {
    await prisma.accessAttempt.create({
      data: {
        licensePlate: licensePlate.toUpperCase(),
        attemptType,
        success,
        failureReason,
        vehicleId,
        parkingId,
        securityOfficerId,
      },
    });
  } catch (error) {
    console.error('Error logging access attempt:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
};

export const getAllParkingRecords = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    // For STUDENT and ADMINISTRATIVE_STAFF, filter by their vehicles
    let whereClause: any = {};

    if (userRole === 'STUDENT' || userRole === 'ADMINISTRATIVE_STAFF') {
      // Get user's vehicle IDs
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map(v => v.id);

      // Filter records to only those with user's vehicles
      whereClause = {
        vehicleId: { in: vehicleIds },
      };
    }

    const records = await prisma.parkingRecord.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        parkingSpace: {
          include: {
            parking: true,
          },
        },
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
    const { vehicleId, parkingSpaceId, preferHandicap } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: 'Vehicle ID is required' });
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
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

    let assignedSpace;

    // If parkingSpaceId is provided, use it (for manual override or preferHandicap=false case)
    if (parkingSpaceId) {
      const space = await prisma.parkingSpace.findUnique({ where: { id: parkingSpaceId } });
      if (!space) {
        return res.status(404).json({ error: 'Parking space not found' });
      }
      if (space.isOccupied) {
        return res.status(409).json({ error: 'Parking space is already occupied' });
      }
      assignedSpace = space;
    } else {
      // Auto-assign based on vehicle type and handicap needs
      const requiresHandicap = vehicle.requiresHandicapSpace && preferHandicap !== false;

      // Build compatible space types based on vehicle
      type SpaceType = 'CAR' | 'MOTORCYCLE' | 'HANDICAP';
      let compatibleSpaceTypes: SpaceType[] = [];

      if (requiresHandicap) {
        // If vehicle requires handicap and user prefers handicap space, only look for handicap
        compatibleSpaceTypes = ['HANDICAP'];
      } else if (vehicle.type === 'MOTORCYCLE') {
        // Motorcycles can park in motorcycle or handicap spaces
        compatibleSpaceTypes = ['MOTORCYCLE', 'HANDICAP'];
      } else {
        // Cars can park in car or handicap spaces
        compatibleSpaceTypes = ['CAR', 'HANDICAP'];
      }

      // Find first available compatible space
      assignedSpace = await prisma.parkingSpace.findFirst({
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
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.parkingRecord.create({
        data: { vehicleId, parkingSpaceId: assignedSpace!.id },
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
        where: { id: assignedSpace!.id },
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
    const userId = req.userId;
    const userRole = req.userRole;

    // For STUDENT and ADMINISTRATIVE_STAFF, filter by their vehicles
    let whereClause: any = { exitTime: null };

    if (userRole === 'STUDENT' || userRole === 'ADMINISTRATIVE_STAFF') {
      // Get user's vehicle IDs
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map(v => v.id);

      // Filter records to only those with user's vehicles
      whereClause.vehicleId = { in: vehicleIds };
    }

    const records = await prisma.parkingRecord.findMany({
      where: whereClause,
      include: {
        vehicle: true,
        parkingSpace: {
          include: {
            parking: true,
          },
        },
      },
      orderBy: { entryTime: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('Get active records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const quickEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { licensePlate, parkingSpaceId, preferHandicap, unregisteredVehicleType, unregisteredRequiresHandicap } = req.body;
    const sessionParkingId = req.sessionParkingId;
    const userRole = req.userRole;

    if (!licensePlate) {
      return res.status(400).json({ error: 'License plate is required' });
    }

    // Security officers must have a parking assigned, but admins can work without one
    if (userRole === 'SECURITY_OFFICER' && !sessionParkingId) {
      return res.status(400).json({ error: 'Security officer must be assigned to a parking' });
    }

    // Search for vehicle by license plate
    let vehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: licensePlate.toUpperCase() },
    });

    let isUnregistered = false;
    let wasBlocked = false;

    if (!vehicle) {
      // Vehicle doesn't exist - this is an unregistered vehicle, allow ONE-TIME entry
      isUnregistered = true;

      // Use the provided vehicle type and handicap info, or default to CAR and false
      const vehicleType = unregisteredVehicleType || 'CAR';
      const requiresHandicap = unregisteredRequiresHandicap || false;

      // Create temporary vehicle record for one-time entry
      vehicle = await prisma.vehicle.create({
        data: {
          licensePlate: licensePlate.toUpperCase(),
          brand: 'Unknown',
          color: 'Unknown',
          type: vehicleType,
          requiresHandicapSpace: requiresHandicap,
          hasEnteredOnce: true,
          ownerId: null, // No owner for unregistered vehicles
        },
      });
    } else if (vehicle.ownerId === null && vehicle.hasEnteredOnce) {
      // Vehicle exists but is unregistered (no owner) and has already entered once
      // Block subsequent entries
      await logAccessAttempt(
        licensePlate.toUpperCase(),
        'ENTRY',
        false,
        'UNREGISTERED_BLOCKED',
        vehicle.id,
        sessionParkingId || null,
        req.userId || null
      );
      return res.status(403).json({
        error: 'Vehicle blocked',
        code: 'UNREGISTERED_BLOCKED',
        message: 'Este vehículo ya utilizó su entrada única. Debe registrarse para poder ingresar.',
        isUnregistered: true,
        wasBlocked: true,
      });
    }

    // Check if vehicle already has an active parking record
    const activeRecord = await prisma.parkingRecord.findFirst({
      where: {
        vehicleId: vehicle.id,
        exitTime: null,
      },
    });

    if (activeRecord) {
      await logAccessAttempt(
        licensePlate.toUpperCase(),
        'ENTRY',
        false,
        'VEHICLE_ALREADY_PARKED',
        vehicle.id,
        sessionParkingId || null,
        req.userId || null
      );
      return res.status(409).json({ error: 'Vehicle is already parked' });
    }

    let assignedSpace;

    // If parkingSpaceId is provided, use it (for manual override or preferHandicap=false case)
    if (parkingSpaceId) {
      const space = await prisma.parkingSpace.findUnique({
        where: { id: parkingSpaceId },
        include: { parking: true },
      });
      if (!space) {
        return res.status(404).json({ error: 'Parking space not found' });
      }
      // Security officers can only assign spaces in their assigned parking
      if (sessionParkingId && space.parkingId !== sessionParkingId) {
        return res.status(403).json({ error: 'You can only assign spaces in your assigned parking' });
      }
      if (space.isOccupied) {
        return res.status(409).json({ error: 'Parking space is already occupied' });
      }
      assignedSpace = space;
    } else {
      // Auto-assign based on vehicle type and handicap needs
      const requiresHandicap = vehicle.requiresHandicapSpace && preferHandicap !== false;

      // Build compatible space types based on vehicle
      type SpaceType = 'CAR' | 'MOTORCYCLE' | 'HANDICAP';
      let compatibleSpaceTypes: SpaceType[] = [];

      if (requiresHandicap) {
        // If vehicle requires handicap and user prefers handicap space, only look for handicap
        compatibleSpaceTypes = ['HANDICAP'];
      } else if (vehicle.type === 'MOTORCYCLE') {
        // Motorcycles can park in motorcycle or handicap spaces
        compatibleSpaceTypes = ['MOTORCYCLE', 'HANDICAP'];
      } else {
        // Cars can park in car or handicap spaces
        compatibleSpaceTypes = ['CAR', 'HANDICAP'];
      }

      // Find first available compatible space
      // If security officer, filter by their assigned parking
      // If admin, search across all parkings
      const whereClause: any = {
        isOccupied: false,
        spaceType: { in: compatibleSpaceTypes },
      };

      if (sessionParkingId) {
        whereClause.parkingId = sessionParkingId;
      }

      assignedSpace = await prisma.parkingSpace.findFirst({
        where: whereClause,
        include: { parking: true },
        orderBy: { spaceNumber: 'asc' },
      });

      if (!assignedSpace) {
        if (requiresHandicap) {
          // No handicap spaces available, inform user
          await logAccessAttempt(
            licensePlate.toUpperCase(),
            'ENTRY',
            false,
            'NO_HANDICAP_SPACES',
            vehicle.id,
            sessionParkingId || null,
            req.userId || null
          );
          return res.status(404).json({
            error: 'No handicap spaces available',
            code: 'NO_HANDICAP_SPACES',
            message: 'No hay espacios para discapacitados disponibles. ¿Desea estacionar en un espacio regular?',
          });
        }
        await logAccessAttempt(
          licensePlate.toUpperCase(),
          'ENTRY',
          false,
          'NO_AVAILABLE_SPACES',
          vehicle.id,
          sessionParkingId || null,
          req.userId || null
        );
        return res.status(404).json({ error: 'No compatible parking spaces available' });
      }
    }

    // Create parking record and update space
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.parkingRecord.create({
        data: { vehicleId: vehicle!.id, parkingSpaceId: assignedSpace!.id },
        include: {
          vehicle: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  dateOfBirth: true,
                  identificationNumber: true,
                },
              },
            },
          },
          parkingSpace: {
            include: {
              parking: true,
            },
          },
        },
      });

      await tx.parkingSpace.update({
        where: { id: assignedSpace!.id },
        data: { isOccupied: true },
      });

      // Log successful access attempt
      await tx.accessAttempt.create({
        data: {
          licensePlate: licensePlate.toUpperCase(),
          attemptType: 'ENTRY',
          success: true,
          failureReason: null,
          vehicleId: vehicle!.id,
          parkingId: assignedSpace!.parkingId,
          securityOfficerId: req.userId || null,
        },
      });

      return newRecord;
    });

    res.status(201).json({
      ...record,
      isUnregistered,
      message: isUnregistered
        ? 'Vehículo no registrado. Se permite entrada única. Debe registrarse para futuros ingresos.'
        : undefined,
    });
  } catch (error: any) {
    console.error('Quick entry error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'License plate already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFailedAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, parkingId, page = '1', limit = '20' } = req.query;

    // Default to last 30 days if no dates provided
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parse dates properly - input format is YYYY-MM-DD
    const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : thirtyDaysAgo;
    // Set end date to end of day in UTC (23:59:59.999) to include all attempts on that day
    const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : now;

    // Build where clause
    const whereClause: any = {
      success: false, // Only failed attempts
      attemptTime: {
        gte: start,
        lte: end,
      },
    };

    if (parkingId) {
      whereClause.parkingId = parseInt(parkingId as string);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await prisma.accessAttempt.count({ where: whereClause });

    // Get failed attempts with related data
    const failedAttempts = await prisma.accessAttempt.findMany({
      where: whereClause,
      include: {
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            licensePlate: true,
            brand: true,
            color: true,
            type: true,
          },
        },
        securityOfficer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { attemptTime: 'desc' },
      skip,
      take: limitNum,
    });

    res.json({
      attempts: failedAttempts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Get failed attempts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
