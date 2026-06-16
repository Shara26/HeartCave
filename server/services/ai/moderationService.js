import { getProvider } from './index.js';
import ModerationLog from '../../models/ModerationLog.js';
import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import {
  MODERATION_STATUS,
  INSTANT_BAN_CATEGORIES,
} from '../../config/constants.js';

// AI FEATURE 1 + 2: moderation + automatic safety alerts + three-strike /
// instant-ban enforcement. Every message/post/comment runs through here
// BEFORE it is delivered.

/**
 * Classify a piece of content. Pure read — no side effects.
 */
export const classify = async (text) => {
  const provider = getProvider();
  return provider.moderate({ text });
};

/**
 * Records a moderation decision and applies enforcement when needed.
 *
 * @returns {{ result, log, enforcement }}
 */
export const moderateAndEnforce = async ({ text, user, sourceType, sourceId }) => {
  const result = await classify(text);

  // Always log non-SAFE outcomes (and BLOCKED/FLAGGED) for the dashboard.
  let log = null;
  if (result.status !== MODERATION_STATUS.SAFE) {
    log = await ModerationLog.create({
      sourceType,
      sourceId,
      user: user._id,
      status: result.status,
      categories: result.categories,
      reason: result.reason,
      score: result.score,
      provider: result.provider,
      contentSnapshot: text.slice(0, 1000),
    });
  }

  let enforcement = { action: 'none' };

  if (result.status === MODERATION_STATUS.BLOCKED) {
    enforcement = await applyEnforcement({ user, result, sourceType, sourceId });
    await raiseModeratorAlert({ user, result });
  }

  return { result, log, enforcement };
};

// Applies three-strike OR instant-ban depending on category.
const applyEnforcement = async ({ user, result, sourceType, sourceId }) => {
  const instant = result.categories.some((c) => INSTANT_BAN_CATEGORIES.includes(c));
  const fresh = await User.findById(user._id);
  if (!fresh) return { action: 'none' };

  if (instant) {
    fresh.violations.push({
      category: result.categories.join(','),
      reason: result.reason,
      severity: 'instant_ban',
      sourceType,
      sourceId,
    });
    fresh.isBanned = true;
    fresh.bannedReason = `Instant ban: ${result.categories.join(', ')}`;
    await fresh.save();
    return { action: 'instant_ban', reason: fresh.bannedReason };
  }

  // Three-strike path.
  fresh.violations.push({
    category: result.categories.join(','),
    reason: result.reason,
    severity: 'warning',
    sourceType,
    sourceId,
  });
  const strikes = fresh.violations.filter((v) => v.severity === 'warning').length;

  if (strikes >= 3) {
    fresh.isBanned = true;
    fresh.bannedReason = 'Permanent ban: three violations';
    await fresh.save();
    return { action: 'ban', strikes };
  }
  if (strikes === 2) {
    fresh.suspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await fresh.save();
    return { action: 'suspend_24h', strikes };
  }
  await fresh.save();
  return { action: 'warning', strikes };
};

// AI FEATURE 2: high-priority alert to all admins for severe content.
const raiseModeratorAlert = async ({ user, result }) => {
  const severe = result.categories.some((c) => INSTANT_BAN_CATEGORIES.includes(c));
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (!admins.length) return;

  await Notification.insertMany(
    admins.map((a) => ({
      user: a._id,
      type: 'moderation_alert',
      priority: severe ? 'high' : 'normal',
      title: severe ? 'Severe content blocked' : 'Content flagged for review',
      body: `User ${user.anonymousName} — ${result.categories.join(', ')}.`,
    }))
  );
};

export default moderateAndEnforce;
