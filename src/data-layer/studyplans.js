/**
 * data-layer/studyplans.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";
import { getCurrentUid } from "./auth";

export const listStudyPlans  = (uid)           => provider.listStudyPlans(uid);

export async function createStudyPlan(plan) {
  const uid = getCurrentUid();
  return provider.createStudyPlan(uid, plan);
}

export async function updateStudyPlan(planId, patch) {
  const uid = getCurrentUid();
  return provider.updateStudyPlan(uid, planId, patch);
}

export async function deleteStudyPlan(planId) {
  const uid = getCurrentUid();
  return provider.deleteStudyPlan(uid, planId);
}
