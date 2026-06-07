/**
 * data-layer/results.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";
import { getCurrentUid } from "./auth";

export const getResults             = ()                => provider.getResults();
export const getUserResults         = (uid, max)        => provider.getUserResults(uid, max);
export const getResultsFiltered     = (opts)            => provider.getResultsFiltered(opts);
export const subscribeResults       = (cb)              => provider.subscribeResults(cb);
export const subscribeUserResults   = (uid, cb)         => provider.subscribeUserResults(uid, cb);
export const getMonthlyUsage        = (uid)             => provider.getMonthlyUsage(uid);
export const recordMockStart        = (uid)             => provider.recordMockStart(uid);
export const FREE_MONTHLY_LIMIT     = provider.FREE_MONTHLY_LIMIT;

export async function saveResult(result) {
  const uid = getCurrentUid();
  return provider.saveResult(result, uid);
}

export async function canStartMock({ uid, isPro }) {
  if (isPro) return { allowed: true, used: 0, limit: Infinity };
  const used = await provider.getMonthlyUsage(uid);
  return { allowed: used < provider.FREE_MONTHLY_LIMIT, used, limit: provider.FREE_MONTHLY_LIMIT };
}
