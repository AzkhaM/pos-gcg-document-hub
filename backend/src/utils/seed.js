const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Seed data
const seedData = {
  users: [
    {
      username: 'admin',
      email: 'admin@posgcg.com',
      password: 'Admin123!',
      nama: 'Administrator',
      role: 'ADMIN',
      direktorat: 'Direktorat Utama',
      subdirektorat: 'Subdirektorat Utama',
      divisi: 'Divisi Utama'
    },
    {
      username: 'user1',
      email: 'user1@posgcg.com',
      password: 'User123!',
      nama: 'User Test 1',
      role: 'USER',
      direktorat: 'Direktorat Keuangan',
      subdirektorat: 'Subdirektorat Akuntansi',
      divisi: 'Divisi Pelaporan'
    }
  ],
  years: [
    { tahun: 2024, nama: 'Tahun Buku 2024', deskripsi: 'Tahun buku 2024' },
    { tahun: 2025, nama: 'Tahun Buku 2025', deskripsi: 'Tahun buku 2025' }
  ],
  aspects: [
    { nama: 'ASPEK 1. KOMITMEN TERHADAP TATA KELOLA YANG BAIK', tahun: 2024 },
    { nama: 'ASPEK 2. PENERAPAN FUNGSI AUDIT INTERNAL', tahun: 2024 },
    { nama: 'ASPEK 3. PENERAPAN FUNGSI COMPLIANCE', tahun: 2024 },
    { nama: 'ASPEK 4. PENERAPAN FUNGSI RISK MANAGEMENT', tahun: 2024 },
    { nama: 'ASPEK 5. PENERAPAN FUNGSI LEGAL', tahun: 2024 },
    { nama: 'ASPEK 1. KOMITMEN TERHADAP TATA KELOLA YANG BAIK', tahun: 2025 },
    { nama: 'ASPEK 2. PENERAPAN FUNGSI AUDIT INTERNAL', tahun: 2025 },
    { nama: 'ASPEK 3. PENERAPAN FUNGSI COMPLIANCE', tahun: 2025 },
    { nama: 'ASPEK 4. PENERAPAN FUNGSI RISK MANAGEMENT', tahun: 2025 },
    { nama: 'ASPEK 5. PENERAPAN FUNGSI LEGAL', tahun: 2025 }
  ],
  checklist: [
    {
      aspek: 'ASPEK 1. KOMITMEN TERHADAP TATA KELOLA YANG BAIK',
      deskripsi: 'Dokumen Kebijakan GCG',
      tahun: 2024
    },
    {
      aspek: 'ASPEK 1. KOMITMEN TERHADAP TATA KELOLA YANG BAIK',
      deskripsi: 'Dokumen Struktur Organisasi',
      tahun: 2024
    },
    {
      aspek: 'ASPEK 2. PENERAPAN FUNGSI AUDIT INTERNAL',
      deskripsi: 'Dokumen Charter Audit Internal',
      tahun: 2024
    },
    {
      aspek: 'ASPEK 2. PENERAPAN FUNGSI AUDIT INTERNAL',
      deskripsi: 'Dokumen Program Audit Tahunan',
      tahun: 2024
    },
    {
      aspek: 'ASPEK 3. PENERAPAN FUNGSI COMPLIANCE',
      deskripsi: 'Dokumen Kebijakan Compliance',
      tahun: 2024
    },
    {
      aspek: 'ASPEK 4. PENERAPAN FUNGSI RISK MANAGEMENT',
      deskripsi: 'Dokumen Kebijakan Manajemen Risiko',
      tahun: 2024
    },
    {
      aspek: 'ASPEK 5. PENERAPAN FUNGSI LEGAL',
      deskripsi: 'Dokumen Kebijakan Legal',
      tahun: 2024
    },
    // 2025 data
    {
      aspek: 'ASPEK 1. KOMITMEN TERHADAP TATA KELOLA YANG BAIK',
      deskripsi: 'Dokumen Kebijakan GCG',
      tahun: 2025
    },
    {
      aspek: 'ASPEK 1. KOMITMEN TERHADAP TATA KELOLA YANG BAIK',
      deskripsi: 'Dokumen Struktur Organisasi',
      tahun: 2025
    },
    {
      aspek: 'ASPEK 2. PENERAPAN FUNGSI AUDIT INTERNAL',
      deskripsi: 'Dokumen Charter Audit Internal',
      tahun: 2025
    },
    {
      aspek: 'ASPEK 2. PENERAPAN FUNGSI AUDIT INTERNAL',
      deskripsi: 'Dokumen Program Audit Tahunan',
      tahun: 2025
    },
    {
      aspek: 'ASPEK 3. PENERAPAN FUNGSI COMPLIANCE',
      deskripsi: 'Dokumen Kebijakan Compliance',
      tahun: 2025
    },
    {
      aspek: 'ASPEK 4. PENERAPAN FUNGSI RISK MANAGEMENT',
      deskripsi: 'Dokumen Kebijakan Manajemen Risiko',
      tahun: 2025
    },
    {
      aspek: 'ASPEK 5. PENERAPAN FUNGSI LEGAL',
      deskripsi: 'Dokumen Kebijakan Legal',
      tahun: 2025
    }
  ],
  struktur: [
    {
      tahun: 2024,
      direktorat: 'Direktorat Keuangan',
      subdirektorat: 'Subdirektorat Akuntansi',
      divisi: 'Divisi Pelaporan'
    },
    {
      tahun: 2024,
      direktorat: 'Direktorat Keuangan',
      subdirektorat: 'Subdirektorat Keuangan',
      divisi: 'Divisi Treasury'
    },
    {
      tahun: 2024,
      direktorat: 'Direktorat Operasional',
      subdirektorat: 'Subdirektorat Produksi',
      divisi: 'Divisi Manufaktur'
    },
    {
      tahun: 2025,
      direktorat: 'Direktorat Keuangan',
      subdirektorat: 'Subdirektorat Akuntansi',
      divisi: 'Divisi Pelaporan'
    },
    {
      tahun: 2025,
      direktorat: 'Direktorat Keuangan',
      subdirektorat: 'Subdirektorat Keuangan',
      divisi: 'Divisi Treasury'
    },
    {
      tahun: 2025,
      direktorat: 'Direktorat Operasional',
      subdirektorat: 'Subdirektorat Produksi',
      divisi: 'Divisi Manufaktur'
    }
  ]
};

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.assignment.deleteMany();
    await prisma.fileUpload.deleteMany();
    await prisma.checklistGCG.deleteMany();
    await prisma.aspek.deleteMany();
    await prisma.strukturPerusahaan.deleteMany();
    await prisma.user.deleteMany();
    await prisma.year.deleteMany();

    // Create years
    console.log('📅 Creating years...');
    for (const yearData of seedData.years) {
      await prisma.year.create({ data: yearData });
    }

    // Create aspects
    console.log('🎯 Creating aspects...');
    for (const aspectData of seedData.aspects) {
      await prisma.aspek.create({ data: aspectData });
    }

    // Create checklist items
    console.log('📋 Creating checklist items...');
    for (const checklistData of seedData.checklist) {
      await prisma.checklistGCG.create({ data: checklistData });
    }

    // Create organizational structure
    console.log('🏢 Creating organizational structure...');
    for (const strukturData of seedData.struktur) {
      await prisma.strukturPerusahaan.create({ data: strukturData });
    }

    // Create users
    console.log('👥 Creating users...');
    for (const userData of seedData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`   - Years: ${seedData.years.length}`);
    console.log(`   - Aspects: ${seedData.aspects.length}`);
    console.log(`   - Checklist items: ${seedData.checklist.length}`);
    console.log(`   - Organizational structure: ${seedData.struktur.length}`);
    console.log(`   - Users: ${seedData.users.length}`);
    console.log('\n🔑 Default admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin123!');
    console.log('\n🔑 Default user credentials:');
    console.log('   Username: user1');
    console.log('   Password: User123!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = { seed };


