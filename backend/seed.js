const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Society = require('./models/Society');
const ProofLog = require('./models/ProofLog');
const ComplianceRecord = require('./models/ComplianceRecord');

dotenv.config();

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Sample data
const societies = [
  {
    societyId: 'SOC-001',
    name: 'Green Valley Apartments',
    ward: 'A-Ward',
    geoLocation: { lat: 19.0760, lng: 72.8777 }, // Mumbai coordinates
    propertyTaxNumber: 'PTN-2024-001',
    address: 'Andheri West, Mumbai',
    totalUnits: 50,
    contactEmail: 'greenvalley@example.com',
    contactPhone: '+91-9876543210'
  },
  {
    societyId: 'SOC-002',
    name: 'Sunshine Residency',
    ward: 'B-Ward',
    geoLocation: { lat: 19.1136, lng: 72.8697 },
    propertyTaxNumber: 'PTN-2024-002',
    address: 'Bandra East, Mumbai',
    totalUnits: 75,
    contactEmail: 'sunshine@example.com',
    contactPhone: '+91-9876543211'
  },
  {
    societyId: 'SOC-003',
    name: 'Palm Grove Society',
    ward: 'A-Ward',
    geoLocation: { lat: 19.0596, lng: 72.8295 },
    propertyTaxNumber: 'PTN-2024-003',
    address: 'Juhu, Mumbai',
    totalUnits: 100,
    contactEmail: 'palmgrove@example.com',
    contactPhone: '+91-9876543212'
  },
  {
    societyId: 'SOC-004',
    name: 'Ocean View Towers',
    ward: 'C-Ward',
    geoLocation: { lat: 18.9220, lng: 72.8347 },
    propertyTaxNumber: 'PTN-2024-004',
    address: 'Worli, Mumbai',
    totalUnits: 120,
    contactEmail: 'oceanview@example.com',
    contactPhone: '+91-9876543213'
  }
];

const users = [
  {
    userId: 'USR-001',
    name: 'BMC Admin',
    email: 'admin@bmc.gov.in',
    password: 'admin123',
    role: 'BMC_ADMIN',
    societyId: null
  },
  {
    userId: 'USR-002',
    name: 'Rajesh Kumar',
    email: 'secretary1@greenvalley.com',
    password: 'secretary123',
    role: 'SECRETARY',
    societyId: null // Will be set after society creation
  },
  {
    userId: 'USR-003',
    name: 'Priya Sharma',
    email: 'secretary2@sunshine.com',
    password: 'secretary123',
    role: 'SECRETARY',
    societyId: null
  },
  {
    userId: 'USR-004',
    name: 'Amit Patel',
    email: 'resident1@greenvalley.com',
    password: 'resident123',
    role: 'RESIDENT',
    societyId: null
  },
  {
    userId: 'USR-005',
    name: 'Sneha Desai',
    email: 'resident2@sunshine.com',
    password: 'resident123',
    role: 'RESIDENT',
    societyId: null
  }
];

// Seed function
const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany();
    await Society.deleteMany();
    await ProofLog.deleteMany();
    await ComplianceRecord.deleteMany();
    console.log('✅ Data cleared');

    // Create societies
    console.log('🏢 Creating societies...');
    const createdSocieties = await Society.insertMany(societies);
    console.log(`✅ Created ${createdSocieties.length} societies`);

    // Assign societies to users
    users[1].societyId = createdSocieties[0]._id; // Secretary 1 -> Green Valley
    users[2].societyId = createdSocieties[1]._id; // Secretary 2 -> Sunshine
    users[3].societyId = createdSocieties[0]._id; // Resident 1 -> Green Valley
    users[4].societyId = createdSocieties[1]._id; // Resident 2 -> Sunshine

    // Create users (password will be hashed by pre-save hook)
    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create sample proof logs
    console.log('📸 Creating sample proof logs...');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const proofLogs = [
      {
        logId: 'PROOF-001',
        societyId: createdSocieties[0]._id,
        imageUrl: 'https://mock-cloudinary.com/green-tax/proof-001.jpg',
        imageHash: 'hash-001-' + Date.now(),
        timestamp: now,
        geoLocation: { lat: 19.0760, lng: 72.8777 },
        status: 'VERIFIED',
        validationReason: 'All validation checks passed',
        uploadedBy: createdUsers[1]._id
      },
      {
        logId: 'PROOF-002',
        societyId: createdSocieties[1]._id,
        imageUrl: 'https://mock-cloudinary.com/green-tax/proof-002.jpg',
        imageHash: 'hash-002-' + Date.now(),
        timestamp: yesterday,
        geoLocation: { lat: 19.1136, lng: 72.8697 },
        status: 'VERIFIED',
        validationReason: 'All validation checks passed',
        uploadedBy: createdUsers[2]._id
      },
      {
        logId: 'PROOF-003',
        societyId: createdSocieties[2]._id,
        imageUrl: 'https://mock-cloudinary.com/green-tax/proof-003.jpg',
        imageHash: 'hash-003-' + Date.now(),
        timestamp: twoDaysAgo,
        geoLocation: { lat: 19.0596, lng: 72.8295 },
        status: 'FLAGGED',
        validationReason: 'Timestamp is not fresh (>30 minutes old)',
        uploadedBy: createdUsers[1]._id
      }
    ];

    await ProofLog.insertMany(proofLogs);
    console.log(`✅ Created ${proofLogs.length} proof logs`);

    // Create sample compliance records
    console.log('📊 Creating compliance records...');
    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const complianceRecords = [
      {
        societyId: createdSocieties[0]._id,
        week: getWeekNumber(now),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        complianceStatus: 'GREEN',
        rebatePercent: 10,
        proofCount: 1,
        lastProofDate: now,
        daysSinceLastProof: 0,
        verifiedProofs: 1,
        flaggedProofs: 0,
        rejectedProofs: 0,
        complianceScore: 100
      },
      {
        societyId: createdSocieties[1]._id,
        week: getWeekNumber(now),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        complianceStatus: 'YELLOW',
        rebatePercent: 5,
        proofCount: 1,
        lastProofDate: yesterday,
        daysSinceLastProof: 1,
        verifiedProofs: 1,
        flaggedProofs: 0,
        rejectedProofs: 0,
        complianceScore: 60
      },
      {
        societyId: createdSocieties[2]._id,
        week: getWeekNumber(now),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        complianceStatus: 'RED',
        rebatePercent: 0,
        proofCount: 1,
        lastProofDate: twoDaysAgo,
        daysSinceLastProof: 2,
        verifiedProofs: 0,
        flaggedProofs: 1,
        rejectedProofs: 0,
        complianceScore: 20
      }
    ];

    await ComplianceRecord.insertMany(complianceRecords);
    console.log(`✅ Created ${complianceRecords.length} compliance records`);

    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║   ✅ SEED DATA CREATED SUCCESSFULLY           ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    console.log('📋 TEST CREDENTIALS:\n');
    console.log('BMC Admin:');
    console.log('  Email: admin@bmc.gov.in');
    console.log('  Password: admin123\n');
    console.log('Secretary (Green Valley):');
    console.log('  Email: secretary1@greenvalley.com');
    console.log('  Password: secretary123\n');
    console.log('Secretary (Sunshine):');
    console.log('  Email: secretary2@sunshine.com');
    console.log('  Password: secretary123\n');
    console.log('Resident (Green Valley):');
    console.log('  Email: resident1@greenvalley.com');
    console.log('  Password: resident123\n');
    console.log('Resident (Sunshine):');
    console.log('  Email: resident2@sunshine.com');
    console.log('  Password: resident123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

// Run seed
seedData();