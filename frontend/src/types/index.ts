export interface User {
  id: number;
  email: string;
  name: string;
  dateOfBirth?: string;
  identificationNumber?: string;
  role: 'ADMIN' | 'SECURITY_OFFICER' | 'ADMINISTRATIVE_STAFF' | 'STUDENT';
  isFirstLogin?: boolean;
  sessionParkingId?: number;
  sessionParking?: {
    id: number;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  color: string;
  type: 'CAR' | 'MOTORCYCLE';
  requiresHandicapSpace: boolean;
  hasEnteredOnce: boolean;
  ownerId: number | null;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export type SpaceType = 'CAR' | 'MOTORCYCLE' | 'HANDICAP';

export interface Parking {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalSpaces?: number;
  occupiedSpaces?: number;
  availableSpaces?: number;
}

export interface ParkingSpace {
  id: number;
  spaceNumber: string;
  spaceType: SpaceType;
  parkingId: number;
  parking?: {
    id: number;
    name: string;
  };
  isOccupied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingRecord {
  id: number;
  vehicleId: number;
  vehicle?: Vehicle;
  parkingSpaceId: number;
  parkingSpace?: ParkingSpace;
  entryTime: string;
  exitTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OccupationReport {
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  occupationRate: number;
  activeParking: ParkingRecord[];
}

export type AttemptType = 'ENTRY' | 'EXIT';

export type FailureReason =
  | 'UNREGISTERED_BLOCKED'
  | 'VEHICLE_ALREADY_PARKED'
  | 'NO_HANDICAP_SPACES'
  | 'NO_AVAILABLE_SPACES'
  | 'SPACE_ALREADY_OCCUPIED'
  | 'PARKING_SPACE_NOT_FOUND'
  | 'INSUFFICIENT_PERMISSIONS';

export interface AccessAttempt {
  id: number;
  licensePlate: string;
  vehicleId: number | null;
  vehicle?: {
    id: number;
    licensePlate: string;
    brand: string;
    color: string;
    type: 'CAR' | 'MOTORCYCLE';
  } | null;
  parkingId: number | null;
  parking?: {
    id: number;
    name: string;
  } | null;
  attemptTime: string;
  attemptType: AttemptType;
  success: boolean;
  failureReason: FailureReason | null;
  securityOfficerId: number | null;
  securityOfficer?: {
    id: number;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

export interface FailedAttemptsResponse {
  attempts: AccessAttempt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
