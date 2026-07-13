/**
 * data-layer/gamification.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const BADGE_CATALOG   = provider.BADGE_CATALOG;
export const getGamification = (uid)  => provider.getGamification(uid);
export const recordAttempt   = (opts) => provider.recordAttempt(opts);
