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

  // Create some parking spaces (20 regular + 2 handicap)
  const spaces = [];
  for (let i = 1; i <= 20; i++) {
    const space = await prisma.parkingSpace.upsert({
      where: { spaceNumber: `A${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        spaceNumber: `A${i.toString().padStart(2, '0')}`,
      },
    });
    spaces.push(space);
  }

  // Add handicap spaces
  for (let i = 1; i <= 2; i++) {
    const space = await prisma.parkingSpace.upsert({
      where: { spaceNumber: `H${i.toString().padStart(2, '0')}` },
      update: {},
      create: {
        spaceNumber: `H${i.toString().padStart(2, '0')}`,
      },
    });
    spaces.push(space);
  }

  console.log(`Created ${spaces.length} parking spaces (20 regular + 2 handicap)`);

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
