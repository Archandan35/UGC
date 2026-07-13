/**
 * src/data-layer/database.js
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  UNIVERSAL DATABASE ABSTRACTION LAYER                           │
 * │                                                                 │
 * │  This is the ONLY file in data-layer/ that communicates         │
 * │  with the data-provider. All other data-layer modules go        │
 * │  through this file OR directly call provider via their own      │
 * │  named wrappers.                                                │
 * │                                                                 │
 * │  RULE: Pages / Components / Hooks / Admin must NEVER import     │
 * │  from data-provider directly. They use data-layer/ only.        │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Universal API exposed:
 *
 *   subscribe(table, cb, filter?)   ← real-time listener
 *   fetchAll(table, opts?)          ← get all records
 *   fetchOne(table, id)             ← get single record
 *   create(table, data)             ← insert record
 *   update(table, id, data)         ← update record
 *   remove(table, id)               ← delete record
 *   removeMany(table, ids)          ← delete multiple
 *   search(table, opts)             ← filtered fetch
 *   filter(table, field, value)     ← field-value filter
 *   count(table, field?, value?)    ← count records
 *   upsert(table, data)             ← insert or update
 */

import { provider } from "../data-provider";

/* ─── Core CRUD ─────────────────────────────────────────────── */

/**
 * Fetch all records from a table.
 * @param {string} table
 * @returns {Promise<Array>}
 */
export const fetchAll = (table) =>
  provider.getCollectionDocs(table);

/**
 * Fetch a single record by id.
 * @param {string} table
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
export const fetchOne = (table, id) => {
  // Route to typed getters when available for consistency
  const typed = {
    users:      () => provider.getUser(id),
    subjects:   () => provider.getSubject(id),
    topics:     () => provider.getTopic(id),
    subtopics:  () => provider.getSubtopic(id),
    questions:  () => provider.getQuestion(id),
    exams:      () => provider.getExam(id),
  };
  return typed[table] ? typed[table]() : provider.getCollectionDocs(table).then(rows => rows.find(r => r.id === id) ?? null);
};

/**
 * Insert a record into a table.
 * @param {string} table
 * @param {object} data
 * @returns {Promise<string>} new record id
 */
export const create = (table, data) => {
  const typed = {
    users:      () => provider.createUser(data),
    subjects:   () => provider.createSubject(data),
    topics:     () => provider.createTopic(data),
    subtopics:  () => provider.createSubtopic(data),
    questions:  () => provider.createQuestion(data),
    exams:      () => provider.createExam(data),
  };
  return typed[table] ? typed[table]() : provider.writeCollection(table, [data]).then(() => data.id);
};

/**
 * Update a record in a table.
 * @param {string} table
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise<void>}
 */
export const update = (table, id, data) => {
  const typed = {
    users:      () => provider.updateUser(id, data),
    subjects:   () => provider.updateSubject(id, data),
    topics:     () => provider.updateTopic(id, data),
    subtopics:  () => provider.updateSubtopic(id, data),
    questions:  () => provider.updateQuestion(id, data),
    exams:      () => provider.updateExam(id, data),
  };
  return typed[table] ? typed[table]() : provider.writeCollection(table, [{ id, ...data }]);
};

/**
 * Delete a single record.
 * @param {string} table
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export const remove = (table, id) => {
  const typed = {
    users:      () => provider.deleteUser(id),
    subjects:   () => provider.deleteSubject(id),
    topics:     () => provider.deleteTopic(id),
    subtopics:  () => provider.deleteSubtopic(id),
    questions:  () => provider.deleteQuestion(id),
    exams:      () => provider.deleteExam(id),
  };
  return typed[table] ? typed[table]() : provider.deleteCollectionDoc(table, id);
};

/**
 * Delete multiple records.
 * @param {string} table
 * @param {Array<string|number>} ids
 * @returns {Promise<void>}
 */
export const removeMany = (table, ids) => {
  const typed = {
    exams: () => provider.deleteExams(ids),
  };
  return typed[table] ? typed[table]() : provider.deleteCollectionDocs(table, ids);
};

/* ─── Query helpers ─────────────────────────────────────────── */

/**
 * Filter records by a single field/value pair.
 * @param {string} table
 * @param {string} field
 * @param {*} value
 * @returns {Promise<Array>}
 */
export const filter = (table, field, value) =>
  provider.getCollectionDocsByField(table, field, value);

/**
 * Search / filtered fetch with multiple conditions.
 * @param {string} table
 * @param {object} opts  — shape depends on table
 * @returns {Promise<Array>}
 */
export const search = (table, opts = {}) => {
  const typed = {
    questions: () => provider.getQuestionsFiltered(opts),
    results:   () => provider.getResultsFiltered(opts),
  };
  return typed[table] ? typed[table]() : fetchAll(table);
};

/**
 * Count records in a table (optional field filter).
 * @param {string} table
 * @param {string} [field]
 * @param {*} [value]
 * @returns {Promise<number>}
 */
export const count = (table, field, value) =>
  field !== undefined
    ? provider.countCollectionByField(table, field, value)
    : provider.countCollection(table);

/**
 * Insert or update (upsert) a record.
 * @param {string} table
 * @param {object} data  — must include id for update
 * @returns {Promise<void>}
 */
export const upsert = (table, data) =>
  provider.writeCollectionMerge(table, [data], "merge");

/* ─── Real-time subscriptions ───────────────────────────────── */

/**
 * Subscribe to real-time changes on a table.
 * Returns an unsubscribe function.
 *
 * @param {string} table
 * @param {function} cb  — called with updated records array
 * @param {object}  [opts]
 * @param {string}  [opts.filterField]  — optional field to filter by
 * @param {*}       [opts.filterValue]
 * @returns {function} unsubscribe
 */
export const subscribe = (table, cb, opts = {}) => {
  const { filterField, filterValue } = opts;

  // Field-scoped subscriptions
  if (filterField && filterField === "uid" && table === "subscriptions") {
    return provider.subscribeSubscription(filterValue, cb);
  }
  if (filterField === "uid" && table === "users") {
    return provider.subscribeUserByUid(filterValue, cb);
  }
  if (filterField === "user_id" && table === "results") {
    return provider.subscribeUserResults(filterValue, cb);
  }

  // Table-level subscriptions
  const typed = {
    users:     () => provider.subscribeUsers(cb),
    subjects:  () => provider.subscribeSubjects(cb),
    topics:    () => provider.subscribeTopics(cb),
    subtopics: () => provider.subscribeSubtopics(cb),
    questions: () => provider.subscribeQuestions(cb),
    results:   () => provider.subscribeResults(cb),
    exams:     () => provider.subscribeExams(cb),
  };

  if (typed[table]) return typed[table]();

  // Fallback: poll every 30s (for tables without real-time support)
  const interval = setInterval(() => fetchAll(table).then(cb), 30000);
  fetchAll(table).then(cb);
  return () => clearInterval(interval);
};

/**
 * Delete records by a field/value pair.
 * @param {string} table
 * @param {string} field
 * @param {*} value
 * @returns {Promise<void>}
 */
export const removeByField = (table, field, value) =>
  provider.deleteDocsByField(table, field, value);

/**
 * Returns a no-op batch object for compatibility.
 * Real batch operations use removeMany / writeCollectionMerge.
 */
export const getBatch = () => provider.writeBatch();

// NOTE: fetchCollection, writeCollection, writeCollectionMerge are intentionally
// NOT exported here — they live in config.js to avoid namespace conflicts
// when both modules are re-exported via data-layer/index.js.
