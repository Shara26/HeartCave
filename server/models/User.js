import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AGE_GROUPS, STRUGGLES, INTERESTS, BADGES } from '../config/constants.js';

const violationSchema = new mongoose.Schema(
  {
    category: String, // e.g. "harassment", "threats"
    reason: String,
    severity: { type: String, enum: ['warning', 'instant_ban'], default: 'warning' },
    sourceType: { type: String, enum: ['message', 'post', 'report', 'admin'], default: 'message' },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Real identity — private, never serialized to other users.
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },

     resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    // Public identity.
    anonymousName: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: '' }, // seed/derived avatar key, not a photo

    // Matching profile.
    ageGroup: { type: String, enum: AGE_GROUPS, required: true },
    interests: [{ type: String, enum: INTERESTS }],
    struggles: [{ type: String, enum: STRUGGLES }],
        customInterests: [{ type: String, trim: true, maxlength: 40 }],
    customStruggles: [{ type: String, trim: true, maxlength: 40 }],

    // Reputation.
    kindnessScore: { type: Number, default: 0, min: 0, max: 100 },
    badges: [{ type: String, enum: BADGES }],

    // Access control + safety.
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBanned: { type: Boolean, default: false },
    bannedReason: { type: String, default: '' },
    suspendedUntil: { type: Date, default: null },
    violations: [violationSchema],

    // Soft list of users this person has blocked.
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    acceptedSafetyPolicy: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index supports the matching query (find candidates by overlap).
userSchema.index({ ageGroup: 1 });
userSchema.index({ struggles: 1 });
userSchema.index({ interests: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isSuspended = function isSuspended() {
  return this.suspendedUntil && this.suspendedUntil.getTime() > Date.now();
};

// Public projection — what other users are allowed to see.
userSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    id: this._id,
    anonymousName: this.anonymousName,
    avatar: this.avatar,
    ageGroup: this.ageGroup,
    interests: this.interests,
    struggles: this.struggles,
     customInterests: this.customInterests || [],
    customStruggles: this.customStruggles || [],
    kindnessScore: this.kindnessScore,
    badges: this.badges,
    joinedAt: this.createdAt,
  };
};

// Private projection — for the owner themselves.
userSchema.methods.toSelf = function toSelf() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    anonymousName: this.anonymousName,
    avatar: this.avatar,
    ageGroup: this.ageGroup,
    interests: this.interests,
    struggles: this.struggles,
     customInterests: this.customInterests || [],
    customStruggles: this.customStruggles || [],
    kindnessScore: this.kindnessScore,
    badges: this.badges,
    role: this.role,
    isBanned: this.isBanned,
    acceptedSafetyPolicy: this.acceptedSafetyPolicy,
    joinedAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
