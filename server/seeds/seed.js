import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import { generateUniqueAnonymousName } from '../utils/anonymousName.js';
import { scorePair } from '../services/matchService.js';
import { generateStarters } from '../services/ai/conversationStarterService.js';
import { STRUGGLES, INTERESTS, AGE_GROUPS, REACTIONS } from '../config/constants.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sample = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

const DEMO = [
  { name: 'Aarav Sharma', email: 'aarav@demo.app' },
  { name: 'Diya Patel', email: 'diya@demo.app' },
  { name: 'Rohan Mehta', email: 'rohan@demo.app' },
  { name: 'Ananya Rao', email: 'ananya@demo.app' },
  { name: 'Kabir Singh', email: 'kabir@demo.app' },
  { name: 'Ishita Nair', email: 'ishita@demo.app' },
  { name: 'Vivaan Gupta', email: 'vivaan@demo.app' },
  { name: 'Saanvi Reddy', email: 'saanvi@demo.app' },
];

const POST_TEXTS = [
  "I'm worried about placements and don't know if I'll get an internship. Some days the pressure feels heavy.",
  'Moved to a new city for work and the loneliness has been hitting hard lately.',
  'Trying to rebuild my confidence after a tough semester. Small wins count, right?',
  'GATE prep is exhausting. How do you all stay consistent without burning out?',
  'Going through a breakup and learning to be okay on my own again.',
  'Some days the academic pressure feels like too much. Glad this space exists.',
];

const run = async () => {
  await connectDB();
  const destroy = process.argv.includes('--destroy');

  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Match.deleteMany({}),
    Message.deleteMany({}),
    ConnectionRequest.deleteMany({}),
  ]);
  console.log('✓ Cleared collections');

  if (destroy) {
    console.log('✓ Destroyed data (--destroy). Exiting.');
    await mongoose.disconnect();
    return;
  }

  // Admin.
  const admin = await User.create({
    name: 'HeartCave Admin',
    email: process.env.ADMIN_EMAIL || 'admin@heartcave.app',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    anonymousName: 'AdminHeart00',
    avatar: 'AD',
    ageGroup: '23-30',
    interests: ['Reading'],
    struggles: ['Career Anxiety'],
    role: 'admin',
    acceptedSafetyPolicy: true,
  });
  console.log(`✓ Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);

  // Demo users — many share "Placement Stress" + tech interests for good matches.
  const users = [];
  for (const d of DEMO) {
    const anonymousName = await generateUniqueAnonymousName(User);
    const struggles = Math.random() > 0.4
      ? sample(['Placement Stress', 'Career Anxiety', 'Academic Pressure', 'GATE Preparation'], 2)
      : sample(STRUGGLES, 2);
    const interests = Math.random() > 0.4
      ? sample(['DSA', 'Programming', 'Design', 'Reading'], 2)
      : sample(INTERESTS, 2);
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({
      name: d.name,
      email: d.email,
      password: 'Password@123',
      anonymousName,
      avatar: anonymousName.slice(0, 2).toUpperCase(),
      ageGroup: pick(['18-22', '18-22', '23-30', AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)]]),
      interests,
      struggles,
      kindnessScore: Math.floor(Math.random() * 60) + 20,
      acceptedSafetyPolicy: true,
    });
    users.push(user);
  }
  console.log(`✓ ${users.length} demo users (password: Password@123)`);

  // Posts with reactions + comments.
  for (let i = 0; i < POST_TEXTS.length; i += 1) {
    const author = users[i % users.length];
    const reactors = sample(users, 3);
    // eslint-disable-next-line no-await-in-loop
    await Post.create({
      userId: author._id,
      content: POST_TEXTS[i],
      reactions: reactors.map((r) => ({ userId: r._id, type: pick(REACTIONS) })),
      comments: [
        {
          userId: pick(users)._id,
          content: 'You are not alone in this. Sending support your way.',
        },
      ],
    });
  }
  console.log('✓ Demo posts created');

  // A couple of accepted matches + a short conversation.
  const [a, b] = users;
  const breakdown = scorePair(a, b);
  const starters = await generateStarters({
    sharedStruggles: breakdown.sharedStruggles,
    sharedInterests: breakdown.sharedInterests,
  });
  const match = await Match.create({
    users: [a._id, b._id],
    matchScore: Math.max(60, breakdown.score),
    matchType: 'Strong Match',
    sharedStruggles: breakdown.sharedStruggles,
    sharedInterests: breakdown.sharedInterests,
    sharedAgeGroup: breakdown.sharedAgeGroup,
    conversationStarters: starters,
    lastMessageAt: new Date(),
  });
  await ConnectionRequest.create({
    from: a._id,
    to: b._id,
    matchScore: match.matchScore,
    matchType: match.matchType,
    sharedStruggles: match.sharedStruggles,
    sharedInterests: match.sharedInterests,
    status: 'accepted',
    matchId: match._id,
  });
  await Message.create([
    { matchId: match._id, senderId: a._id, content: 'Hey, saw we matched on placement stress. How are you holding up?' },
    { matchId: match._id, senderId: b._id, content: "Honestly some days are rough, but it helps to talk. You?", read: true, readAt: new Date() },
    { matchId: match._id, senderId: a._id, content: 'Same here. Want to share what worked for you this week?' },
  ]);
  console.log('✓ Demo match + conversation created');

  console.log('\n✅ Seed complete.');
  console.log('   Admin login:', admin.email);
  console.log('   Demo user:  ', users[0].email, '/ Password@123');
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('✗ Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
