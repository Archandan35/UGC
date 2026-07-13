/**
 * data-layer/bookmarks.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const fetchBookmarks     = (uid)                     => provider.fetchBookmarks(uid);
export const addBookmark        = (uid, question)           => provider.addBookmark(uid, question);
export const removeBookmark     = (uid, questionId)         => provider.removeBookmark(uid, questionId);
export const getBookmarks       = (uid)                     => provider.fetchBookmarks(uid);
export const createBookmark     = (uid, question)           => provider.addBookmark(uid, question);
export const deleteBookmark     = (uid, questionId)         => provider.removeBookmark(uid, questionId);

export async function syncBookmarks(uid, localMap, questions) {
  if (!uid) return;
  const qById = Object.fromEntries((questions || []).map(q => [q.id, q]));
  const ops = Object.entries(localMap || {}).map(([qId, on]) =>
    on ? provider.addBookmark(uid, qById[qId] || { id: qId })
       : provider.removeBookmark(uid, qId)
  );
  await Promise.allSettled(ops);
}
