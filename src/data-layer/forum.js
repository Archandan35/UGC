/**
 * data-layer/forum.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";
import { getCurrentUser } from "./auth";

export const listThreads    = (opts)            => provider.listThreads(opts);
export const getThread      = (threadId)        => provider.getThread(threadId);
export const listReplies    = (threadId, max)   => provider.listReplies(threadId, max);

export async function createThread(opts) {
  const user = getCurrentUser();
  return provider.createThread(opts, user);
}

export async function postReply(threadId, body) {
  const user = getCurrentUser();
  return provider.postReply(threadId, body, user);
}

export const getForumThreads = (opts)           => provider.listThreads(opts);
export const getForumThread  = (id)             => provider.getThread(id);
export const getForumReplies = (threadId, max)  => provider.listReplies(threadId, max);
