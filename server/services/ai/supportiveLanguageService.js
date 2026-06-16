import { classify } from './moderationService.js';
import { MODERATION_STATUS } from '../../config/constants.js';

// AI FEATURE 5: pre-send "supportive language check". Returns whether the
// draft may read as hurtful so the UI can offer a gentle nudge to revise.
// This is advisory only — the real moderation pipeline still runs on send.
export const checkDraft = async (text) => {
  const result = await classify(text);
  const needsReview = result.status !== MODERATION_STATUS.SAFE;
  return {
    needsReview,
    status: result.status,
    suggestion: needsReview
      ? 'This message may come across as hurtful. Would you like to revise it?'
      : '',
  };
};

export default checkDraft;
