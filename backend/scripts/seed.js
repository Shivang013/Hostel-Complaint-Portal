// Run with: npm run seed
// Creates one admin and one warden account so you can log in and test role-based access
// without manually editing the database.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedUsers = [
  { name: 'Admin User', email: 'admin@hostel.com', password: 'admin123', role: 'admin' },
  { name: 'Warden A', email: 'wardenA@hostel.com', password: 'warden123', role: 'warden' },
  { name: 'Warden B', email: 'wardenB@hostel.com', password: 'warden123', role: 'warden' },
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`Skipping ${u.email} - already exists`);
        continue;
      }
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({ ...u, password: hashedPassword });
      console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

run();
