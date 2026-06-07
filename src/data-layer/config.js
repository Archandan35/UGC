/**
 * data-layer/config.js
 *
 * Exams, audit logs, collection helpers, mock generator, analytics.
 * Knows NOTHING about any database provider.
 * Delegates everything to provider.
 */
import { provider } from "../data-provider";

/* ─── Exams ─────────────────────────────────────────────────── */
export const getExams       = ()         => provider.getExams();
export const getExam        = (id)       => provider.getExam(id);
export const createExam     = (data)     => provider.createExam(data);
export const updateExam     = (id, data) => provider.updateExam(id, data);
export const deleteExam     = (id)       => provider.deleteExam(id);
export const deleteExams    = (ids)      => provider.deleteExams(ids);
export const subscribeExams = (cb)       => provider.subscribeExams(cb);

/* ─── Audit ─────────────────────────────────────────────────── */
export const logAdminAction     = (...a) => provider.logAdminAction(...a);
export const getRecentAuditLogs = (...a) => provider.getRecentAuditLogs(...a);

/* ─── Generic collection helpers ────────────────────────────── */
export const getCollectionDocs        = (col)           => provider.getCollectionDocs(col);
export const getCollectionDocsByField = (col, f, v)     => provider.getCollectionDocsByField(col, f, v);
export const deleteCollectionDoc      = (col, id)       => provider.deleteCollectionDoc(col, id);
export const deleteCollectionDocs     = (col, ids)      => provider.deleteCollectionDocs(col, ids);

/* ─── Mock generator ────────────────────────────────────────── */
export const generateMocks = (opts) => provider.generateMocks(opts);

/* ─── Analytics ─────────────────────────────────────────────── */
export const trackEvent = (name, payload, uid) => provider.trackEvent(name, payload, uid);

/* ─── Bulk / DatabaseManagement adapters ────────────────────── */
export const fetchCollection        = (colId, onP)             => provider.fetchCollection(colId, onP);
export const writeCollection        = (colId, rows, onP)       => provider.writeCollection(colId, rows, onP);
export const writeCollectionMerge   = (colId, rows, mode, onP) => provider.writeCollectionMerge(colId, rows, mode, onP);
export const countCollection        = (colId)                  => provider.countCollection(colId);
export const countCollectionByField = (colId, field, value)    => provider.countCollectionByField(colId, field, value);

/**
 * Remove records from a collection by a field/value pair.
 * Provider-agnostic name (was: deleteDocsByField — Firebase-ism removed).
 */
export const removeRecordsByField   = (colId, field, value)    => provider.deleteDocsByField(colId, field, value);

/** @deprecated Use removeRecordsByField */
export const deleteDocsByField      = removeRecordsByField;

/**
 * Returns a no-op document reference for batch compatibility.
 * Provider-agnostic name (was: deleteDocRef — Firebase-ism removed).
 */
export const getRecordRef           = (colId, docId)           => provider.deleteDocRef(colId, docId);

/** @deprecated Use getRecordRef */
export const deleteDocRef           = getRecordRef;

export const getWriteBatch          = ()                       => provider.writeBatch();
