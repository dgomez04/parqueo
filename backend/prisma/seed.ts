import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user (already changed password)
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@parqueo.com' },
    update: {},
    create: {
      email: 'admin@parqueo.com',
      password: adminPassword,
      name: 'System Administrator',
      dateOfBirth: new Date('1980-01-01'),
      identificationNumber: '1-1111-1111',
      role: 'ADMIN',
      isFirstLogin: false, // Admin already set their password
    },
  });

  console.log('Created admin user:', admin.email);

  // Create security officer user
  const securityPassword = await bcrypt.hash('Ulacit123', 10);
  const securityOfficer = await prisma.user.upsert({
    where: { email: 'security@parqueo.com' },
    update: {},
    create: {
      email: 'security@parqueo.com',
      password: securityPassword,
      name: 'Carlos Mora',
      dateOfBirth: new Date('1985-05-15'),
      identificationNumber: '2-2222-2222',
      role: 'SECURITY_OFFICER',
      isFirstLogin: true,
    },
  });

  console.log('Created security officer user:', securityOfficer.email);

  // Create administrative staff user
  const staffPassword = await bcrypt.hash('Ulacit123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@parqueo.com' },
    update: {},
    create: {
      email: 'staff@parqueo.com',
      password: staffPassword,
      name: 'Maria Rodriguez',
      dateOfBirth: new Date('1990-08-20'),
      identificationNumber: '3-3333-3333',
      role: 'ADMINISTRATIVE_STAFF',
      isFirstLogin: true,
    },
  });

  console.log('Created administrative staff user:', staff.email);

  // Create student user
  const studentPassword = await bcrypt.hash('Ulacit123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@parqueo.com' },
    update: {},
    create: {
      email: 'student@parqueo.com',
      password: studentPassword,
      name: 'Juan Perez',
      dateOfBirth: new Date('2000-03-10'),
      identificationNumber: '4-4444-4444',
      role: 'STUDENT',
      isFirstLogin: true,
    },
  });

  console.log('Created student user:', student.email);

  // Create Parkings
  const parkingPrincipal = await prisma.parking.upsert({
    where: { name: 'Parqueo Principal' },
    update: {},
    create: {
      name: 'Parqueo Principal',
    },
  });

  console.log('Created parking:', parkingPrincipal.name);

  const parkingAires = await prisma.parking.upsert({
    where: { name: 'Parqueo Los Aires' },
    update: {},
    create: {
      name: 'Parqueo Los Aires',
    },
  });

  console.log('Created parking:', parkingAires.name);

  // Create parking spaces for Parqueo Principal (15 regular + 1 handicap)
  const spacesPrincipal = [];
  for (let i = 1; i <= 15; i++) {
    const spaceNumber = `A${i.toString().padStart(2, '0')}`;
    const space = await prisma.parkingSpace.upsert({
      where: {
        parkingId_spaceNumber: {
          parkingId: parkingPrincipal.id,
          spaceNumber: spaceNumber,
        }
      },
      update: {},
      create: {
        spaceNumber: spaceNumber,
        parkingId: parkingPrincipal.id,
      },
    });
    spacesPrincipal.push(space);
  }

  // Add handicap space to Parqueo Principal
  const handicapSpace1 = await prisma.parkingSpace.upsert({
    where: {
      parkingId_spaceNumber: {
        parkingId: parkingPrincipal.id,
        spaceNumber: 'H01',
      }
    },
    update: {},
    create: {
      spaceNumber: 'H01',
      spaceType: 'HANDICAP',
      parkingId: parkingPrincipal.id,
    },
  });
  spacesPrincipal.push(handicapSpace1);

  console.log(`Created ${spacesPrincipal.length} parking spaces for ${parkingPrincipal.name} (15 regular + 1 handicap)`);

  // Create parking spaces for Parqueo Los Aires (5 regular + 1 handicap)
  const spacesAires = [];
  for (let i = 1; i <= 5; i++) {
    const spaceNumber = `B${i.toString().padStart(2, '0')}`;
    const space = await prisma.parkingSpace.upsert({
      where: {
        parkingId_spaceNumber: {
          parkingId: parkingAires.id,
          spaceNumber: spaceNumber,
        }
      },
      update: {},
      create: {
        spaceNumber: spaceNumber,
        parkingId: parkingAires.id,
      },
    });
    spacesAires.push(space);
  }

  // Add handicap space to Parqueo Los Aires
  const handicapSpace2 = await prisma.parkingSpace.upsert({
    where: {
      parkingId_spaceNumber: {
        parkingId: parkingAires.id,
        spaceNumber: 'H02',
      }
    },
    update: {},
    create: {
      spaceNumber: 'H02',
      spaceType: 'HANDICAP',
      parkingId: parkingAires.id,
    },
  });
  spacesAires.push(handicapSpace2);

  console.log(`Created ${spacesAires.length} parking spaces for ${parkingAires.name} (5 regular + 1 handicap)`);

  // Create a sample vehicle for the student
  const vehicle1 = await prisma.vehicle.upsert({
    where: { licensePlate: 'ABC-1234' },
    update: {},
    create: {
      licensePlate: 'ABC-1234',
      brand: 'Honda',
      color: 'Blue',
      type: 'CAR',
      requiresHandicapSpace: false,
      ownerId: student.id,
    },
  });

  console.log('Created sample vehicle:', vehicle1.licensePlate);

  // Create a second vehicle for the staff member
  const vehicle2 = await prisma.vehicle.upsert({
    where: { licensePlate: 'XYZ-5678' },
    update: {},
    create: {
      licensePlate: 'XYZ-5678',
      brand: 'Toyota',
      color: 'Red',
      type: 'CAR',
      requiresHandicapSpace: true,
      ownerId: staff.id,
    },
  });

  console.log('Created sample vehicle:', vehicle2.licensePlate);

  console.log('\nSeeding completed!');
  console.log('\n=== Default Credentials ===');
  console.log('Admin - email: admin@parqueo.com, password: admin123 (no password change required)');
  console.log('Security Officer - email: security@parqueo.com, password: Ulacit123 (must change on first login)');
  console.log('Staff - email: staff@parqueo.com, password: Ulacit123 (must change on first login)');
  console.log('Student - email: student@parqueo.com, password: Ulacit123 (must change on first login)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
