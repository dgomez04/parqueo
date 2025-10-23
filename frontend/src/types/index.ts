export interface User {
  id: number;
  email: string;
  name: string;
  dateOfBirth?: string;
  identificationNumber?: string;
  role: 'ADMIN' | 'SECURITY_OFFICER' | 'ADMINISTRATIVE_STAFF' | 'STUDENT';
  isFirstLogin?: boolean;
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
  ownerId: number;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ParkingSpace {
  id: number;
  spaceNumber: string;
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
