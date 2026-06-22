import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import { generateUniqueAnonymousName } from '../utils/anonymousName.js';

const EMAIL = process.env.ADMIN_EMAIL || 'admin@heartcave.app';
const PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

const run = async () => {
  await connectDB();

  // password is select:false, so request it explicitly.
  let admin = await User.findOne({ email: EMAIL }).select('+password');

  if (admin) {
    admin.role = 'admin';
    admin.password = PASSWORD;        // re-hashed by the pre-save hook
    admin.acceptedSafetyPolicy = true;
    admin.isBanned = false;
    await admin.save();
    console.log(`✓ Promoted existing account to admin & reset password: ${EMAIL}`);
  } else {
    const anonymousName = await generateUniqueAnonymousName(User);
    admin = await User.create({
      name: 'HeartCave Admin',
      email: EMAIL,
      password: PASSWORD,             // hashed by the pre-save hook
      anonymousName,
      avatar: anonymousName.slice(0, 2).toUpperCase(),
      ageGroup: '23-30',
      interests: ['Reading'],
      struggles: ['Career Anxiety'],
      role: 'admin',
      acceptedSafetyPolicy: true,
    });
    console.log(`✓ Admin account created: ${EMAIL} / ${PASSWORD}`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('✗ createAdmin failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});