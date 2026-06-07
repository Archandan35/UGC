/**
 * src/data-provider/data-info.js
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  THE ONLY FILE IN THE ENTIRE APPLICATION THAT KNOWS         │
 * │  WHICH DATABASE IS BEING USED.                              │
 * │                                                             │
 * │  Backend = Supabase (PostgreSQL + Supabase Auth)            │
 * │                                                             │
 * │  RULE: No file outside this file may import from:           │
 * │    firebase/*   supabase   mongodb   pg   mysql             │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ──────────────────────────────────────────────────────────────
 * REQUIRED SUPABASE TABLES  (run this SQL in Supabase SQL Editor)
 * ──────────────────────────────────────────────────────────────
 *
 *  users, subjects, topics, subtopics, questions, results,
 *  bookmarks, forumThreads, forumReplies, exams, auditLogs,
 *  analyticsEvents, subscriptions, usage, gamification,
 *  studyPlans
 *
 *  See the full CREATE TABLE script in /docs/supabase-schema.sql
 *
 * ──────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

/* ─── Supabase initialisation ─────────────────────────────── */
const _supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/* ─── Channel counter (prevents "cannot add callbacks after subscribe()" errors) ─── */
// Each call to a subscribe function gets a unique channel name,
// so multiple React components can independently subscribe to the same table.
let _channelSeq = 0;
const _ch = (name) => `${name}-${++_channelSeq}`;

/* ─── UID cache — populated by auth state change, avoids async getSession() ─── */
let _cachedUid = null;
_supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUid = session?.user?.id ?? null;
});
// Also populate immediately from existing session (handles page refresh)
_supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user?.id) _cachedUid = session.user.id;
});

/* ─── Helpers ──────────────────────────────────────────────── */
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffInDays(aKey, bKey) {
  return Math.round(
    (new Date(bKey + "T00:00:00") - new Date(aKey + "T00:00:00")) / 86400000
  );
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Throw on any Supabase error */
function _check(result, label = "") {
  if (result.error) throw new Error(`[${label}] ${result.error.message}`);
  return result;
}

/**
 * Add camelCase aliases to snake_case Supabase row fields.
 * Runs after every DB read so UI code can use either form safely.
 * This bridges the gap between Supabase snake_case returns and
 * the camelCase field names the frontend was written against.
 */
function _normalizeRow(row) {
  if (!row || typeof row !== "object") return row;
  const r = { ...row };
  // Hierarchy IDs
  if ("subject_id"   in r) r.subjectId    = r.subject_id;
  if ("topic_id"     in r) r.topicId      = r.topic_id;
  if ("sub_topic_id" in r) r.subTopicId   = r.sub_topic_id;
  // Results — handle BOTH old column names (pre-migration) and new (post-migration)
  if ("userid"       in r) r.userId       = r.userid;
  if ("user_id"      in r) r.userId       = r.user_id;
  if ("examid"       in r) r.examId       = r.examid;
  if ("exam_id"      in r) r.examId       = r.exam_id;
  if ("examname"     in r) r.examName     = r.examname;
  if ("exam_name"    in r) r.examName     = r.exam_name;
  if ("examtype"     in r) r.examType     = r.examtype;
  if ("exam_type"    in r) r.examType     = r.exam_type;
  if ("totalmarks"   in r) r.totalMarks   = r.totalmarks;
  if ("total_marks"  in r) r.totalMarks   = r.total_marks;
  if ("totalquestions" in r) r.totalQuestions = r.totalquestions;
  if ("total_questions" in r) r.totalQuestions = r.total_questions;
  if ("timetaken"    in r) r.timeTaken    = r.timetaken;
  if ("time_taken"   in r) r.timeTaken    = r.time_taken;
  if ("cheatcount"   in r) r.cheatCount   = r.cheatcount;
  if ("cheat_count"  in r) r.cheatCount   = r.cheat_count;
  if ("topicid"      in r) r.topicId      = r.topicid;   // results table legacy
  if ("subtopicid"   in r) r.subTopicId   = r.subtopicid;
  // Timestamps
  if ("createdat"    in r) r.createdAt    = r.createdat;
  if ("created_at"   in r) r.createdAt    = r.created_at;
  if ("submittedat"  in r) r.submittedAt  = r.submittedat;
  if ("submitted_at" in r) r.submittedAt  = r.submitted_at;
  if ("updated_at"   in r) r.updatedAt    = r.updated_at;
  // Questions
  if ("correct_answer" in r) r.correctAnswer = r.correct_answer;
  // Exams — snake_case DB columns → camelCase frontend fields
  if ("mock_type"       in r) r.mockType      = r.mock_type;
  if ("topic_name"      in r) r.topicName     = r.topic_name;
  if ("sub_topic_name"  in r) r.subTopicName  = r.sub_topic_name;
  if ("sub_topic_id"    in r) r.subTopicId    = r.sub_topic_id;
  if ("topic_id"        in r && !r.topicId)   r.topicId     = r.topic_id;
  if ("question_ids"    in r) r.questionIds   = r.question_ids;
  if ("total_questions" in r && !r.totalQuestions) r.totalQuestions = r.total_questions;
  return r;
}

function _normalizeRows(rows) {
  return (rows || []).map(_normalizeRow);
}

/**
 * Fetches ALL rows from a Supabase table by paginating in batches of 1000.
 * Supabase/PostgREST enforces a server-side max-rows cap (default 1000)
 * that cannot be overridden by .limit() alone. Pagination is the only
 * reliable way to retrieve more than 1000 rows.
 *
 * @param {string} table - table name
 * @param {string} [select="*"] - select expression
 * @returns {Promise<object[]>} all rows concatenated
 */
async function _fetchAllRows(table, select = "*") {
  const PAGE = 1000;
  let from = 0;
  let allRows = [];
  while (true) {
    const { data, error } = await _supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`[_fetchAllRows:${table}] ${error.message}`);
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < PAGE) break; // last page
    from += PAGE;
  }
  return allRows;
}

/* ═══════════════════════════════════════════════════════════════
   SCHEMA TRANSLATION LAYER
   ─────────────────────────────────────────────────────────────
   This is THE ONLY place that knows the mapping between the
   camelCase frontend model and Supabase's snake_case columns.
   Nothing outside this file should know column names.
═══════════════════════════════════════════════════════════════ */

/**
 * Actual columns that exist in the Supabase `users` table.
 * Every key NOT in this set is silently dropped before an insert/update
 * so Supabase never sees a column it doesn't know about.
 */
const _USER_DB_COLUMNS = new Set([
  "uid", "name", "email", "phone", "role",
  "is_active", "created_at", "updated_at",
]);

/* ─────────────────────────────────────────────────────────────
   PER-TABLE IMPORT TRANSLATORS
   Maps Firebase/backup camelCase fields → Supabase column names.
   Used only by writeCollection / writeCollectionMerge.
   Add a new entry here when a new table is added to Supabase.
───────────────────────────────────────────────────────────── */

/**
 * For each table, defines:
 *   pk        — the Supabase primary key column name
 *   allowed   — Set of column names that actually exist in Supabase
 *   map       — camelCase backup field → Supabase column name
 *
 * Fields present in the backup but NOT in `allowed` are dropped silently.
 * Fields in `map` are renamed before insert.
 */
const _TABLE_IMPORT_CONFIG = {
  users: {
    pk: "uid",
    allowed: new Set(["uid","name","email","phone","role","is_active","created_at","updated_at"]),
    map: {
      createdAt:  "created_at",
      updatedAt:  "updated_at",
      isActive:   "is_active",
      // Composite name from firstName + lastName handled in transformer below
    },
    transform: (doc) => {
      const row = {};
      // uid: use doc.uid (firebase auth uid) as the PK
      if (doc.uid)       row.uid        = doc.uid;
      if (doc.name)      row.name       = doc.name;
      else if (doc.firstName || doc.lastName)
        row.name = `${doc.firstName || ""} ${doc.lastName || ""}`.trim();
      if (doc.email)     row.email      = doc.email;
      if (doc.phone)     row.phone      = doc.phone;
      if (doc.role)      row.role       = doc.role;
      // is_active: derive from status or isActive or isOnline fields
      row.is_active = doc.isActive !== undefined ? Boolean(doc.isActive)
                    : doc.status !== undefined   ? doc.status === "active"
                    : true;
      row.created_at = doc.createdAt  ? new Date(doc.createdAt).toISOString()
                     : doc.created_at ? doc.created_at
                     : new Date().toISOString();
      if (doc.updatedAt)  row.updated_at = new Date(doc.updatedAt).toISOString();
      if (doc.updated_at) row.updated_at = doc.updated_at;
      return row;
    },
  },

  subjects: {
    pk: "id",
    allowed: new Set(["id","name","created_at"]),
    map: { createdAt: "created_at" },
    transform: (doc) => {
      const row = {};
      if (doc._id)       row.id         = doc._id;
      if (doc.name)      row.name       = doc.name;
      row.created_at = doc.createdAt  ? new Date(doc.createdAt).toISOString()
                     : doc.created_at ? doc.created_at
                     : new Date().toISOString();
      return row;
    },
  },

  topics: {
    pk: "id",
    allowed: new Set(["id","name","subject_id","created_at"]),
    map: { subjectId: "subject_id", createdAt: "created_at" },
    transform: (doc) => {
      const row = {};
      if (doc._id)        row.id         = doc._id;
      if (doc.name)       row.name       = doc.name;
      if (doc.subjectId)  row.subject_id = doc.subjectId;
      row.created_at = doc.createdAt  ? new Date(doc.createdAt).toISOString()
                     : doc.created_at ? doc.created_at
                     : new Date().toISOString();
      return row;
    },
  },

  subtopics: {
    pk: "id",
    allowed: new Set(["id","name","subject_id","topic_id","created_at"]),
    map: { subjectId: "subject_id", topicId: "topic_id", createdAt: "created_at" },
    transform: (doc) => {
      const row = {};
      if (doc._id)        row.id         = doc._id;
      if (doc.name)       row.name       = doc.name;
      if (doc.subjectId)  row.subject_id = doc.subjectId;
      if (doc.topicId)    row.topic_id   = doc.topicId;
      row.created_at = doc.createdAt  ? new Date(doc.createdAt).toISOString()
                     : doc.created_at ? doc.created_at
                     : new Date().toISOString();
      return row;
    },
  },

  questions: {
    pk: "id",
    allowed: new Set(["id","question","options","correct_answer","subject_id","topic_id",
                       "sub_topic_id","difficulty","explanation","language","created_at"]),
    map: {
      correctAnswer: "correct_answer",
      subjectId:     "subject_id",
      topicId:       "topic_id",
      subTopicId:    "sub_topic_id",
      createdAt:     "created_at",
    },
    transform: (doc) => {
      const row = {};
      if (doc._id)            row.id             = doc._id;
      if (doc.question)       row.question       = doc.question;
      if (doc.options)        row.options        = doc.options;
      if (doc.correctAnswer !== undefined) row.correct_answer = doc.correctAnswer;
      if (doc.subjectId)      row.subject_id     = doc.subjectId;
      if (doc.topicId)        row.topic_id       = doc.topicId;
      if (doc.subTopicId)     row.sub_topic_id   = doc.subTopicId;
      if (doc.difficulty)     row.difficulty     = doc.difficulty;
      if (doc.explanation)    row.explanation    = doc.explanation;
      if (doc.language)       row.language       = doc.language;
      row.created_at = doc.createdAt  ? new Date(doc.createdAt).toISOString()
                     : doc.created_at ? doc.created_at
                     : new Date().toISOString();
      return row;
    },
  },

  results: {
    pk: "id",
    // Matches the actual lowercase column names visible in the Supabase screenshot
    allowed: new Set(["id","userid","examid","examname","subject","examtype","answers",
                       "questions","bookmarks","review","score","totalmarks","totalquestions",
                       "correct","wrong","unanswered","accuracy","timetaken","cheatcount",
                       "email","topicid","subtopicid","submittedat","createdat","total"]),
    map: {
      userId:         "userid",
      examId:         "examid",
      examName:       "examname",
      examType:       "examtype",
      totalMarks:     "totalmarks",
      totalQuestions: "totalquestions",
      timeTaken:      "timetaken",
      cheatCount:     "cheatcount",
      topicId:        "topicid",
      subTopicId:     "subtopicid",
      submittedAt:    "submittedat",
      createdAt:      "createdat",
    },
    transform: (doc) => {
      const row = {};
      if (doc._id)               row.id             = doc._id;
      if (doc.userId)            row.userid         = doc.userId;
      if (doc.examId)            row.examid         = doc.examId;
      if (doc.examName)          row.examname       = doc.examName;
      if (doc.subject)           row.subject        = doc.subject;
      if (doc.examType)          row.examtype       = doc.examType;
      if (doc.answers)           row.answers        = doc.answers;
      if (doc.questions)         row.questions      = doc.questions;
      if (doc.bookmarks)         row.bookmarks      = doc.bookmarks;
      if (doc.review)            row.review         = doc.review;
      if (doc.score !== undefined) row.score        = doc.score;
      if (doc.totalMarks !== undefined) row.totalmarks = doc.totalMarks;
      if (doc.totalQuestions !== undefined) row.totalquestions = doc.totalQuestions;
      if (doc.correct !== undefined)  row.correct   = doc.correct;
      if (doc.wrong !== undefined)    row.wrong      = doc.wrong;
      if (doc.unanswered !== undefined) row.unanswered = doc.unanswered;
      if (doc.accuracy)          row.accuracy       = doc.accuracy;
      if (doc.timeTaken)         row.timetaken      = doc.timeTaken;
      if (doc.cheatCount !== undefined) row.cheatcount = doc.cheatCount;
      if (doc.email)             row.email          = doc.email;
      if (doc.topicId)           row.topicid        = doc.topicId;
      if (doc.subTopicId)        row.subtopicid     = doc.subTopicId;
      if (doc.submittedAt)       row.submittedat    = doc.submittedAt;
      if (doc.createdAt)         row.createdat      = new Date(doc.createdAt).toISOString();
      if (doc.total !== undefined) row.total        = doc.total;
      return row;
    },
  },
};

/**
 * Transform a backup document for import into Supabase.
 * Uses per-table config if available, otherwise does a generic
 * camelCase → snake_case pass and maps _id → id.
 */
function _transformForImport(colId, doc) {
  const cfg = _TABLE_IMPORT_CONFIG[colId];
  if (cfg?.transform) return cfg.transform(doc);

  // Generic fallback: map _id → id, keep everything else as-is
  const { _id, ...rest } = doc;
  return { ...(_id ? { id: _id } : {}), ...rest };
}

/**
 * Convert a frontend (camelCase) user object → Supabase row (snake_case).
 * Only columns that actually exist in the DB are kept.
 */
function _userToDb(data) {
  const row = {};

  // Direct mappings: camelCase frontend field → snake_case DB column
  if (data.uid        !== undefined) row.uid        = data.uid;
  if (data.name       !== undefined) row.name       = data.name;
  if (data.email      !== undefined) row.email      = data.email;
  if (data.phone      !== undefined) row.phone      = data.phone;
  if (data.role       !== undefined) row.role       = data.role;

  // camelCase → snake_case mappings
  if (data.isActive   !== undefined) row.is_active  = data.isActive;
  if (data.createdAt  !== undefined) row.created_at = data.createdAt;
  if (data.updatedAt  !== undefined) row.updated_at = data.updatedAt;

  // status → is_active mapping (frontend uses "active"/"inactive" string)
  if (data.status !== undefined && data.isActive === undefined) {
    row.is_active = data.status === "active";
  }

  // Composite name from firstName + lastName (frontend stores these separately)
  if ((data.firstName !== undefined || data.lastName !== undefined) && data.name === undefined) {
    row.name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  }

  // Ensure only known DB columns survive (safety net)
  for (const key of Object.keys(row)) {
    if (!_USER_DB_COLUMNS.has(key)) delete row[key];
  }

  return row;
}

/**
 * Convert a Supabase row (snake_case) → frontend object (camelCase).
 * Adds virtual/computed fields the UI layer expects.
 */
function _userFromDb(row) {
  if (!row) return null;
  return {
    // Pass through all raw columns so nothing is lost
    ...row,

    // The users table PK is "uid". Expose it as both "uid" and "id"
    // so UI code that does user.id still works.
    id:         row.uid,

    // camelCase aliases so the UI can use either form
    createdAt:  row.created_at  ?? null,
    updatedAt:  row.updated_at  ?? null,
    isActive:   row.is_active   ?? true,

    // UI convenience: status string derived from is_active
    status: row.is_active === false ? "inactive" : "active",

    // Fields that existed in the old Firebase model but are not in DB —
    // return safe defaults so the UI never crashes on missing fields.
    firstName:   row.name ? row.name.split(" ")[0] : "",
    lastName:    row.name ? row.name.split(" ").slice(1).join(" ") : "",
    displayName: row.name || "",
    username:    row.email ? row.email.split("@")[0] : "",
    isOnline:    false,
    lastSeen:    null,
    lastLogin:   null,
    permissions: [],
  };
}

/** Map an array of DB rows to frontend objects */
function _usersFromDb(rows) {
  return (rows || []).map(_userFromDb);
}

/* ═══════════════════════════════════════════════════════════════
   AUTH  (Supabase Auth)
═══════════════════════════════════════════════════════════════ */
const _authProvider = {
  registerEmail: async (email, pw) => {
    const res = await _supabase.auth.signUp({ email, password: pw });
    _check(res, "registerEmail");
    return res;
  },

  loginEmail: async (email, pw) => {
    const res = await _supabase.auth.signInWithPassword({ email, password: pw });
    _check(res, "loginEmail");
    return res;
  },

  loginGoogle: async () => {
    const res = await _supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    _check(res, "loginGoogle");
    return res;
  },

  resetPassword: async (email) => {
    const res = await _supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    _check(res, "resetPassword");
    return res;
  },

  logout: () => _supabase.auth.signOut(),

  setDisplayName: async (name) => {
    const res = await _supabase.auth.updateUser({ data: { displayName: name } });
    _check(res, "setDisplayName");
    return res;
  },

  /**
   * Returns an unsubscribe function, just like Firebase's onAuthStateChanged.
   * The callback receives the Supabase `session.user` (or null on sign-out).
   *
   * FIX: onAuthStateChange does NOT fire on page refresh if the session is
   * already cached in localStorage. We must call getSession() immediately to
   * emit the current user, then let onAuthStateChange handle future changes.
   */
  subscribeAuthState: (cb) => {
    // Immediately emit the currently cached session (handles page refresh).
    _supabase.auth.getSession().then(({ data: { session } }) => {
      cb(session?.user ?? null);
    });

    const { data: { subscription } } = _supabase.auth.onAuthStateChange(
      (_event, session) => cb(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  },

  getCurrentUser: () => {
    // Supabase stores the session synchronously after initial load
    return _supabase.auth.getUser().then(r => r.data?.user ?? null);
  },

  getCurrentUid: () => {
    // Return cached uid (set by auth state subscription above)
    return _cachedUid;
  },

  getCurrentUidAsync: async () => {
    // Definitive async fallback — always accurate
    if (_cachedUid) return _cachedUid;
    const { data: { session } } = await _supabase.auth.getSession();
    return session?.user?.id ?? null;
  },

  getAuth: () => _supabase.auth,

  getCurrentUidAsync: async () => {
    if (_cachedUid) return _cachedUid;
    const { data: { session } } = await _supabase.auth.getSession();
    return session?.user?.id ?? null;
  },

  /** Supabase has no "secondary app" concept — create a fresh admin client server-side if needed */
  getSecondaryAuth: () => _supabase.auth,

  updatePassword: async (_user, pw) => {
    const res = await _supabase.auth.updateUser({ password: pw });
    _check(res, "updatePassword");
    return res;
  },

  deleteAuthUser: async (_user) => {
    // Supabase user deletion must be done from the server (service role key).
    // Call your own Edge Function / backend endpoint here.
    throw new Error(
      "deleteAuthUser: call a server-side Edge Function with the service-role key."
    );
  },

  // Kept for API-surface compatibility; Supabase handles re-auth via updateUser
  reauthenticateWithCredential: async (_credential) => {
    throw new Error("reauthenticateWithCredential: use loginEmail then updatePassword.");
  },

  EmailAuthProvider: { credential: (email, pw) => ({ email, pw }) },

  createUserWithEmailAndPassword: async (email, pw) => {
    const res = await _supabase.auth.signUp({ email, password: pw });
    _check(res, "createUserWithEmailAndPassword");
    return res;
  },

  sendPasswordResetEmail: async (email) => {
    const res = await _supabase.auth.resetPasswordForEmail(email);
    _check(res, "sendPasswordResetEmail");
    return res;
  },

  signOutAuth: () => _supabase.auth.signOut(),
};

/* ═══════════════════════════════════════════════════════════════
   USERS  (table: users)
═══════════════════════════════════════════════════════════════ */
const _usersProvider = {
  getUsers: async () => {
    const { data } = _check(await _supabase.from("users").select("*"), "getUsers");
    return _usersFromDb(data);
  },

  getUser: async (id) => {
    const { data } = _check(
      // users table has no "id" column — uid is the PK
      await _supabase.from("users").select("*").eq("uid", id).maybeSingle(),
      "getUser"
    );
    return _userFromDb(data);
  },

  getUserByUid: async (uid) => {
    if (!uid) return null;
    const { data } = _check(
      await _supabase.from("users").select("*").eq("uid", uid).maybeSingle(),
      "getUserByUid"
    );
    return _userFromDb(data);
  },

  getUserByEmail: async (email) => {
    if (!email) return null;
    const { data } = _check(
      await _supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle(),
      "getUserByEmail"
    );
    return _userFromDb(data);
  },

  getUsersByUids: async (uids) => {
    if (!uids?.length) return [];
    const { data } = _check(
      await _supabase.from("users").select("*").in("uid", uids),
      "getUsersByUids"
    );
    return _usersFromDb(data);
  },

  getUsersByPhone: async (variants) => {
    if (!variants?.length) return [];
    const { data } = _check(
      await _supabase.from("users").select("*").in("phone", variants),
      "getUsersByPhone"
    );
    return _usersFromDb(data);
  },

  createUser: async (data) => {
    // Translate camelCase frontend object → snake_case DB row
    const payload = _userToDb(data);
    // Ensure created_at is always set
    if (!payload.created_at) payload.created_at = new Date().toISOString();
    const { data: row } = _check(
      // users table PK is "uid" (uuid), there is no "id" column
      await _supabase.from("users").insert(payload).select("uid").single(),
      "createUser"
    );
    return row.uid;
  },

  createUserWithId: async (docId, data) => {
    const payload = _userToDb(data);
    if (!payload.created_at) payload.created_at = new Date().toISOString();
    // docId here is the auth uid — map it to the uid column (the PK)
    if (!payload.uid && docId) payload.uid = docId;
    await _check(
      await _supabase
        .from("users")
        .upsert(payload),
      "createUserWithId"
    );
    return payload.uid || docId;
  },

  updateUser: async (id, data) => {
    // Translate only the changed fields
    const payload = _userToDb(data);
    if (Object.keys(payload).length === 0) return; // nothing to update
    // "id" passed in is actually the uid (the only PK on this table)
    _check(await _supabase.from("users").update(payload).eq("uid", id), "updateUser");
  },

  deleteUser: async (id) => {
    _check(await _supabase.from("users").delete().eq("uid", id), "deleteUser");
  },

  subscribeUsers: (cb) => {
    // FIX: Immediately fetch all users on subscribe so the table populates on first load.
    _supabase.from("users").select("*").then(({ data }) => cb(_usersFromDb(data || [])));

    const channel = _supabase
      .channel(_ch("users-all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, async () => {
        const { data } = await _supabase.from("users").select("*");
        cb(_usersFromDb(data || []));
      })
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  subscribeUserByUid: (uid, cb) => {
    _supabase
      .from("users")
      .select("*")
      .eq("uid", uid)
      .maybeSingle()
      .then(({ data }) => cb(_userFromDb(data)));

    const channel = _supabase
      .channel(`user-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users", filter: `uid=eq.${uid}` },
        async () => {
          const { data } = await _supabase
            .from("users")
            .select("*")
            .eq("uid", uid)
            .maybeSingle();
          cb(_userFromDb(data));
        }
      )
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  markUserOnline: async (docId) => {
    if (!docId) return;
    _supabase
      .from("users")
      .update({ updated_at: new Date().toISOString() })
      .eq("uid", docId)
      .then(() => {});
  },

  markUserOffline: async (docId) => {
    if (!docId) return;
    _supabase
      .from("users")
      .update({ updated_at: new Date().toISOString() })
      .eq("uid", docId)
      .then(() => {});
  },

  getSubscription: async (uid) => {
    if (!uid) return null;
    const { data } = _check(
      await _supabase.from("subscriptions").select("*").eq("uid", uid).maybeSingle(),
      "getSubscription"
    );
    return data;
  },

  subscribeSubscription: (uid, cb) => {
    // FIX: Immediately fetch current subscription and call callback.
    _supabase
      .from("subscriptions")
      .select("*")
      .eq("uid", uid)
      .maybeSingle()
      .then(({ data }) => cb(data));

    const channel = _supabase
      .channel(`sub-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `uid=eq.${uid}` },
        async () => {
          const { data } = await _supabase
            .from("subscriptions")
            .select("*")
            .eq("uid", uid)
            .maybeSingle();
          cb(data);
        }
      )
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  deleteUserCompletely: async (user) => {
    // users table PK is uid; use that for all deletes
    const uid = user.uid || user.id;
    if (!uid) return;

    const tablesWithUserId = [
      "results", "examAttempts", "mockAttempts", "activityLogs", "analytics",
      "performanceReports", "weakTopics", "strongTopics", "subjectAnalysis",
      "topicAnalysis", "subtopicAnalysis", "userSessions", "bookmarks",
      "notifications", "leaderboard", "examHistory",
    ];
    await Promise.allSettled([
      ...tablesWithUserId.map(t =>
        _supabase.from(t).delete().eq("user_id", uid)
      ),
      ...tablesWithUserId.map(t =>
        _supabase.from(t).delete().eq("uid", uid)
      ),
      ...tablesWithUserId.map(t =>
        _supabase.from(t).delete().eq("userid", uid)
      ),
      _supabase.from("users").delete().eq("uid", uid),
    ]);
  },
};

/* ═══════════════════════════════════════════════════════════════
   SUBJECTS  (table: subjects)
═══════════════════════════════════════════════════════════════ */
const _subjectsProvider = {
  getSubjects: async () => {
    const { data } = _check(await _supabase.from("subjects").select("*"), "getSubjects");
    return _normalizeRows(data);
  },

  getSubject: async (id) => {
    const { data } = _check(
      await _supabase.from("subjects").select("*").eq("id", id).maybeSingle(),
      "getSubject"
    );
    return data;
  },

  createSubject: async (data) => {
    const { data: row } = _check(
      await _supabase
        .from("subjects")
        .insert({ ...data, created_at: new Date().toISOString() })
        .select("id")
        .single(),
      "createSubject"
    );
    return row.id;
  },

  updateSubject: async (id, d) => {
    _check(await _supabase.from("subjects").update(d).eq("id", id), "updateSubject");
  },

  deleteSubject: async (id) => {
    _check(await _supabase.from("subjects").delete().eq("id", id), "deleteSubject");
  },

  subscribeSubjects: (cb) => {
    // Immediately emit current data so pages render on first load
    _supabase.from("subjects").select("*").then(({ data }) => cb(_normalizeRows(data)));

    const channel = _supabase
      .channel(_ch("subjects-all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "subjects" }, async () => {
        const { data } = await _supabase.from("subjects").select("*");
        cb(_normalizeRows(data || []));
      })
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  checkSubjectDuplicate: async (name) => {
    const { data } = _check(
      await _supabase.from("subjects").select("id").eq("name", name.trim()).maybeSingle(),
      "checkSubjectDuplicate"
    );
    return !!data;
  },

  deleteSubjectCascade: async (id) => {
    await Promise.all([
      _supabase.from("topics").delete().eq("subject_id", id),
      _supabase.from("subtopics").delete().eq("subject_id", id),
      _supabase.from("questions").delete().eq("subject_id", id),
      _supabase.from("exams").delete().eq("subject_id", id),
    ]);
    _check(await _supabase.from("subjects").delete().eq("id", id), "deleteSubjectCascade");
  },
};

/* ═══════════════════════════════════════════════════════════════
   TOPICS  (table: topics)
═══════════════════════════════════════════════════════════════ */
const _topicsProvider = {
  getTopics: async () => {
    const { data } = _check(await _supabase.from("topics").select("*"), "getTopics");
    return _normalizeRows(data);
  },

  getTopic: async (id) => {
    const { data } = _check(
      await _supabase.from("topics").select("*").eq("id", id).maybeSingle(),
      "getTopic"
    );
    return data;
  },

  getTopicsBySubject: async (subjectId) => {
    const { data } = _check(
      await _supabase.from("topics").select("*").eq("subject_id", subjectId),
      "getTopicsBySubject"
    );
    return data;
  },

  createTopic: async (data) => {
    const { data: row } = _check(
      await _supabase
        .from("topics")
        .insert({ ...data, created_at: new Date().toISOString() })
        .select("id")
        .single(),
      "createTopic"
    );
    return row.id;
  },

  updateTopic: async (id, d) => {
    _check(await _supabase.from("topics").update(d).eq("id", id), "updateTopic");
  },

  deleteTopic: async (id) => {
    _check(await _supabase.from("topics").delete().eq("id", id), "deleteTopic");
  },

  subscribeTopics: (cb) => {
    _supabase.from("topics").select("*").then(({ data }) => cb(_normalizeRows(data)));

    const channel = _supabase
      .channel(_ch("topics-all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "topics" }, async () => {
        const { data } = await _supabase.from("topics").select("*");
        cb(_normalizeRows(data || []));
      })
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  checkTopicDuplicate: async (name, subjectId) => {
    const { data } = _check(
      await _supabase
        .from("topics")
        .select("id")
        .eq("name", name.trim())
        .eq("subject_id", subjectId)
        .maybeSingle(),
      "checkTopicDuplicate"
    );
    return !!data;
  },

  deleteTopicCascade: async (id) => {
    await Promise.all([
      _supabase.from("subtopics").delete().eq("topic_id", id),
      _supabase.from("questions").delete().eq("topic_id", id),
      _supabase.from("exams").delete().eq("topic_id", id),
    ]);
    _check(await _supabase.from("topics").delete().eq("id", id), "deleteTopicCascade");
  },
};

/* ═══════════════════════════════════════════════════════════════
   SUBTOPICS  (table: subtopics)
═══════════════════════════════════════════════════════════════ */
const _subtopicsProvider = {
  getSubtopics: async () => {
    const { data } = _check(
      await _supabase.from("subtopics").select("*"),
      "getSubtopics"
    );
    return _normalizeRows(data);
  },

  getSubtopic: async (id) => {
    const { data } = _check(
      await _supabase.from("subtopics").select("*").eq("id", id).maybeSingle(),
      "getSubtopic"
    );
    return data;
  },

  getSubtopicsByTopic: async (topicId) => {
    const { data } = _check(
      await _supabase.from("subtopics").select("*").eq("topic_id", topicId),
      "getSubtopicsByTopic"
    );
    return data;
  },

  createSubtopic: async (data) => {
    const { data: row } = _check(
      await _supabase
        .from("subtopics")
        .insert({ ...data, created_at: new Date().toISOString() })
        .select("id")
        .single(),
      "createSubtopic"
    );
    return row.id;
  },

  updateSubtopic: async (id, d) => {
    _check(await _supabase.from("subtopics").update(d).eq("id", id), "updateSubtopic");
  },

  deleteSubtopic: async (id) => {
    _check(await _supabase.from("subtopics").delete().eq("id", id), "deleteSubtopic");
  },

  subscribeSubtopics: (cb) => {
    _supabase.from("subtopics").select("*").then(({ data }) => cb(_normalizeRows(data)));

    const channel = _supabase
      .channel(_ch("subtopics-all"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subtopics" },
        async () => {
          const { data } = await _supabase.from("subtopics").select("*");
          cb(_normalizeRows(data || []));
        }
      )
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  checkSubtopicDuplicate: async (name, subjectId, topicId) => {
    const { data } = _check(
      await _supabase
        .from("subtopics")
        .select("id")
        .eq("name", name.trim())
        .eq("subject_id", subjectId)
        .eq("topic_id", topicId)
        .maybeSingle(),
      "checkSubtopicDuplicate"
    );
    return !!data;
  },

  deleteSubtopicCascade: async (id) => {
    await Promise.all([
      _supabase.from("questions").delete().eq("sub_topic_id", id),
      _supabase.from("exams").delete().eq("sub_topic_id", id),
    ]);
    _check(
      await _supabase.from("subtopics").delete().eq("id", id),
      "deleteSubtopicCascade"
    );
  },
};

/* ═══════════════════════════════════════════════════════════════
   QUESTIONS  (table: questions)
═══════════════════════════════════════════════════════════════ */
const _questionsProvider = {
  getQuestions: async () => {
    // Use paginated fetch — Supabase PostgREST enforces a server-side 1000-row cap
    // that .limit() alone cannot override. _fetchAllRows pages through in batches.
    const data = await _fetchAllRows("questions");
    return _normalizeRows(data);
  },

  getQuestion: async (id) => {
    const { data } = _check(
      await _supabase.from("questions").select("*").eq("id", id).maybeSingle(),
      "getQuestion"
    );
    return data;
  },

  getQuestionsByIds: async (ids) => {
    if (!ids?.length) return [];
    const { data } = _check(
      await _supabase.from("questions").select("*").in("id", ids),
      "getQuestionsByIds"
    );
    return _normalizeRows(data);
  },

  getQuestionsBySubject: async (subject) => {
    const { data } = _check(
      await _supabase.from("questions").select("*").eq("subject", subject),
      "getQuestionsBySubject"
    );
    return _normalizeRows(data);
  },

  getQuestionsBySubjectId: async (subjectId) => {
    const { data } = _check(
      await _supabase.from("questions").select("*").eq("subject_id", subjectId),
      "getQuestionsBySubjectId"
    );
    return _normalizeRows(data);
  },

  getQuestionsFiltered: async ({ examId, paperId, language, pyqYear, max = 100 } = {}) => {
    const { buildContentFilter } = await import("../data/examCatalog");
    const filter = buildContentFilter({ examId, paperId, language, pyqYear });
    let q = _supabase.from("questions").select("*").limit(max);
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
    const { data } = _check(await q, "getQuestionsFiltered");
    return data;
  },

  createQuestion: async (data) => {
    const { data: row } = _check(
      await _supabase
        .from("questions")
        .insert({ ...data, created_at: new Date().toISOString() })
        .select("id")
        .single(),
      "createQuestion"
    );
    return row.id;
  },

  updateQuestion: async (id, d) => {
    _check(await _supabase.from("questions").update(d).eq("id", id), "updateQuestion");
  },

  deleteQuestion: async (id) => {
    _check(await _supabase.from("questions").delete().eq("id", id), "deleteQuestion");
  },

  subscribeQuestions: (cb) => {
    // Use paginated fetch — Supabase PostgREST enforces a server-side 1000-row cap
    // that .limit() alone cannot override. _fetchAllRows pages through in batches.
    _fetchAllRows("questions").then((data) => cb(_normalizeRows(data)));

    const channel = _supabase
      .channel(_ch("questions-all"))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        async () => {
          const data = await _fetchAllRows("questions");
          cb(_normalizeRows(data));
        }
      )
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  checkQuestionDuplicate: async (text, subTopicId) => {
    const { data } = _check(
      await _supabase
        .from("questions")
        .select("id")
        .eq("question", text.trim())
        .eq("sub_topic_id", subTopicId)
        .maybeSingle(),
      "checkQuestionDuplicate"
    );
    return !!data;
  },
};

/* ═══════════════════════════════════════════════════════════════
   RESULTS  (table: results)
═══════════════════════════════════════════════════════════════ */
const _resultsProvider = {
  getResults: async () => {
    const { data } = _check(await _supabase.from("results").select("*"), "getResults");
    return _normalizeRows(data);
  },

  getUserResults: async (uid, max = 50) => {
    if (!uid) return [];
    // Try both column names to handle pre- and post-migration states
    const { data, error } = await _supabase
      .from("results")
      .select("*")
      .eq("user_id", uid)
      .order("submitted_at", { ascending: false })
      .limit(max);

    if (error && error.message.includes("does not exist")) {
      // Column not yet renamed — fall back to legacy names
      const { data: legacyData } = await _supabase
        .from("results")
        .select("*")
        .eq("userid", uid)
        .order("submittedat", { ascending: false })
        .limit(max);
      return _normalizeRows(legacyData);
    }

    return _normalizeRows(data);
  },

  getResultsFiltered: async ({ since, max = 500 } = {}) => {
    // Try snake_case first (post-migration); fall back to legacy if column missing
    let q = _supabase.from("results").select("*").limit(max);
    try {
      q = q.order("created_at", { ascending: false });
      if (since) q = q.gte("created_at", since);
      const { data, error } = await q;
      if (error && error.message.includes("does not exist")) throw error;
      return _normalizeRows(data);
    } catch {
      // Pre-migration fallback
      let q2 = _supabase.from("results").select("*").limit(max).order("createdat", { ascending: false });
      if (since) q2 = q2.gte("createdat", since);
      const { data } = await q2;
      return _normalizeRows(data);
    }
  },

  saveResult: async (result, uid) => {
    const resolvedUid = uid || _cachedUid || null;
    const now = new Date().toISOString();

    // Minimal payload — only columns confirmed in legacy schema (from DB screenshot).
    // Deliberately omits: mode, paper_id, language, pyq_year, question_ids, time_per_question
    // to avoid "column not found in schema cache" errors on old DBs.
    const payload = {
      userid:         resolvedUid || "anonymous",
      examid:         result.examId || null,
      examname:       result.examName || null,
      examtype:       result.examType || result.mode || "mock",
      score:          result.score ?? 0,
      totalmarks:     result.totalMarks ?? 0,
      totalquestions: result.questions?.length ?? result.totalQuestions ?? 0,
      correct:        result.correct ?? 0,
      wrong:          result.wrong ?? 0,
      unanswered:     result.unattempted ?? result.unanswered ?? 0,
      accuracy:       result.accuracy ?? 0,
      answers:        result.answers || {},
      timetaken:      result.timePerQuestion
        ? Object.values(result.timePerQuestion).reduce((a, b) => a + b, 0)
        : 0,
      cheatcount:     result.cheatCount ?? 0,
      submittedat:    result.submittedAt || now,
      createdat:      now,
    };

    const res = await _supabase.from("results").insert(payload).select("id").single();
    if (!res.error) return res.data.id;

    // Log the real error but don't throw — navigation must still happen
    console.error("[saveResult] insert failed:", res.error.message, "| payload keys:", Object.keys(payload).join(", "));

    // Retry with absolute minimum — just score + uid so result page still gets an ID
    const minPayload = {
      userid:      resolvedUid || "anonymous",
      examid:      result.examId || null,
      score:       result.score ?? 0,
      correct:     result.correct ?? 0,
      wrong:       result.wrong ?? 0,
      unanswered:  result.unattempted ?? 0,
      submittedat: now,
      createdat:   now,
    };
    const res2 = await _supabase.from("results").insert(minPayload).select("id").single();
    if (!res2.error) return res2.data.id;

    // If DB is completely broken, return a client-side ID so navigation still works
    console.error("[saveResult] min insert also failed:", res2.error.message);
    return `local_${Date.now()}`;
  },

  subscribeResults: (cb) => {
    _supabase.from("results").select("*").then(({ data }) => cb(_normalizeRows(data)));

    const channel = _supabase
      .channel(_ch("results-all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, async () => {
        const { data } = await _supabase.from("results").select("*");
        cb(_normalizeRows(data || []));
      })
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  subscribeUserResults: (uid, cb) => {
    const channel = _supabase
      .channel(`results-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results", filter: `user_id=eq.${uid}` },
        async () => {
          const { data } = await _supabase
            .from("results")
            .select("*")
            .eq("user_id", uid);
          cb(data || []);
        }
      )
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },

  getMonthlyUsage: async (uid) => {
    if (!uid) return 0;
    const key = monthKey();
    const { data } = _check(
      await _supabase
        .from("usage")
        .select("mocks")
        .eq("id", `${uid}_${key}`)
        .maybeSingle(),
      "getMonthlyUsage"
    );
    return data?.mocks || 0;
  },

  recordMockStart: async (uid) => {
    if (!uid) return;
    const key = monthKey();
    const id = `${uid}_${key}`;
    // Upsert with increment using Supabase RPC or manual read-modify-write
    const { data: existing } = await _supabase
      .from("usage")
      .select("mocks")
      .eq("id", id)
      .maybeSingle();
    const mocks = (existing?.mocks || 0) + 1;
    _check(
      await _supabase
        .from("usage")
        .upsert({ id, uid, month: key, mocks, updated_at: new Date().toISOString() }),
      "recordMockStart"
    );
  },

  FREE_MONTHLY_LIMIT: 5,
};

/* ═══════════════════════════════════════════════════════════════
   BOOKMARKS  (table: bookmarks)
═══════════════════════════════════════════════════════════════ */
const _bookmarksProvider = {
  fetchBookmarks: async (uid) => {
    if (!uid) return {};
    const { data } = _check(
      await _supabase.from("bookmarks").select("*").eq("uid", uid),
      "fetchBookmarks"
    );
    const map = {};
    (data || []).forEach(b => { map[b.question_id] = { id: b.question_id, ...b }; });
    return map;
  },

  addBookmark: async (uid, question) => {
    if (!uid || !question?.id) return;
    _check(
      await _supabase.from("bookmarks").upsert({
        uid,
        question_id: question.id,
        exam_id:     question.examId || null,
        paper_id:    question.paperId || null,
        subject:     question.subject || null,
        text:        question.text || question.question || "",
        created_at:  new Date().toISOString(),
      }),
      "addBookmark"
    );
  },

  removeBookmark: async (uid, questionId) => {
    if (!uid || !questionId) return;
    _check(
      await _supabase.from("bookmarks").delete().eq("uid", uid).eq("question_id", questionId),
      "removeBookmark"
    );
  },
};

/* ═══════════════════════════════════════════════════════════════
   FORUM  (tables: forumThreads, forumReplies)
═══════════════════════════════════════════════════════════════ */
const _forumProvider = {
  listThreads: async ({ tag = null, max = 50 } = {}) => {
    let q = _supabase
      .from("forumThreads")
      .select("*")
      .order("last_activity_at", { ascending: false })
      .limit(max);
    if (tag) q = q.contains("tags", [tag]);
    const { data } = _check(await q, "listThreads");
    return data;
  },

  getThread: async (threadId) => {
    const { data } = _check(
      await _supabase.from("forumThreads").select("*").eq("id", threadId).maybeSingle(),
      "getThread"
    );
    return data;
  },

  listReplies: async (threadId, max = 200) => {
    const { data } = _check(
      await _supabase
        .from("forumReplies")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true })
        .limit(max),
      "listReplies"
    );
    return data;
  },

  createThread: async ({ title, body, tags = [] }, user) => {
    if (!user) throw new Error("Sign in required");
    const now = new Date().toISOString();
    const { data: row } = _check(
      await _supabase
        .from("forumThreads")
        .insert({
          title:            String(title || "").slice(0, 160),
          body:             String(body || "").slice(0, 4000),
          tags:             tags.slice(0, 8),
          author_uid:       user.uid || user.id,
          author_name:      user.displayName || user.email,
          reply_count:      0,
          created_at:       now,
          last_activity_at: now,
        })
        .select("id")
        .single(),
      "createThread"
    );
    return row.id;
  },

  postReply: async (threadId, body, user) => {
    if (!user) throw new Error("Sign in required");
    const now = new Date().toISOString();
    _check(
      await _supabase.from("forumReplies").insert({
        thread_id:   threadId,
        body:        String(body || "").slice(0, 4000),
        author_uid:  user.uid || user.id,
        author_name: user.displayName || user.email,
        created_at:  now,
      }),
      "postReply"
    );
    // Increment reply count
    const { data: t } = await _supabase
      .from("forumThreads")
      .select("reply_count")
      .eq("id", threadId)
      .maybeSingle();
    await _supabase
      .from("forumThreads")
      .update({ reply_count: (t?.reply_count || 0) + 1, last_activity_at: now })
      .eq("id", threadId);
  },
};

/* ═══════════════════════════════════════════════════════════════
   EXAMS  (table: exams)
═══════════════════════════════════════════════════════════════ */
/**
 * Convert a frontend (camelCase) exam object → Supabase snake_case row.
 * Does NOT include the `questions` field (full objects) — the table stores IDs only.
 */
function _examToDb(data) {
  const row = {};
  if (data.name            !== undefined) row.name             = data.name;
  if (data.mockType        !== undefined) row.mock_type        = data.mockType;
  if (data.subject         !== undefined) row.subject          = data.subject;
  if (data.subjectId       !== undefined) row.subject_id       = data.subjectId;
  if (data.topicName       !== undefined) row.topic_name       = data.topicName;
  if (data.topicId         !== undefined) row.topic_id         = data.topicId;
  if (data.subTopicName    !== undefined) row.sub_topic_name   = data.subTopicName;
  if (data.subTopicId      !== undefined) row.sub_topic_id     = data.subTopicId;
  if (data.duration        !== undefined) row.duration         = data.duration;
  if (data.quantity        !== undefined) row.quantity         = data.quantity;
  if (data.totalQuestions  !== undefined) row.total_questions  = data.totalQuestions;
  // Resolve question IDs from either questionIds[] or questions[] array
  const ids = data.questionIds
    || (Array.isArray(data.questions) ? data.questions.map(q => q.id) : undefined);
  if (ids !== undefined) row.question_ids = ids;
  // Never insert full question objects — the exams table only stores IDs
  return row;
}

/**
 * Attempt insert with snake_case columns. If Supabase reports a missing column,
 * retry once with camelCase column names (for databases imported with camelCase).
 */
async function _createExamRow(dbRow) {
  const ts = new Date().toISOString();
  const res = await _supabase
    .from("exams")
    .insert({ ...dbRow, created_at: ts })
    .select("id")
    .single();

  if (!res.error) return res;

  const msg = res.error.message || "";
  // Only retry on column-name errors
  if (!msg.includes("column") && !msg.includes("does not exist")) return res;

  console.warn("[createExam] snake_case columns failed, trying camelCase:", msg);
  const cc = {
    name:           dbRow.name,
    mockType:       dbRow.mock_type,
    subject:        dbRow.subject,
    subjectId:      dbRow.subject_id,
    topicName:      dbRow.topic_name,
    topicId:        dbRow.topic_id,
    subTopicName:   dbRow.sub_topic_name,
    subTopicId:     dbRow.sub_topic_id,
    duration:       dbRow.duration,
    quantity:       dbRow.quantity,
    totalQuestions: dbRow.total_questions,
    questionIds:    dbRow.question_ids,
    createdAt:      ts,
  };
  // Strip undefined values
  Object.keys(cc).forEach(k => cc[k] === undefined && delete cc[k]);
  return _supabase.from("exams").insert(cc).select("id").single();
}

const _examsProvider = {
  getExams: async () => {
    const { data } = _check(await _supabase.from("exams").select("*"), "getExams");
    return _normalizeRows(data);
  },

  getExam: async (id) => {
    const { data } = _check(
      await _supabase.from("exams").select("*").eq("id", id).maybeSingle(),
      "getExam"
    );
    return _normalizeRow(data);
  },

  createExam: async (data) => {
    const dbRow = _examToDb(data);
    const res = await _createExamRow(dbRow);
    if (res.error) {
      // Surface the real Supabase error so it shows in the browser console
      console.error("[createExam] Supabase error:", res.error.message, res.error.details || "", res.error.hint || "");
      throw new Error(`[createExam] ${res.error.message}`);
    }
    return res.data.id;
  },

  updateExam: async (id, d) => {
    const dbRow = _examToDb(d);
    // Try snake_case first, fall back to camelCase on column errors
    const res = await _supabase.from("exams").update(dbRow).eq("id", id);
    if (res.error) {
      if (res.error.message?.includes("column") || res.error.message?.includes("does not exist")) {
        const cc = {};
        if (dbRow.name           !== undefined) cc.name           = dbRow.name;
        if (dbRow.mock_type      !== undefined) cc.mockType       = dbRow.mock_type;
        if (dbRow.subject        !== undefined) cc.subject        = dbRow.subject;
        if (dbRow.subject_id     !== undefined) cc.subjectId      = dbRow.subject_id;
        if (dbRow.topic_name     !== undefined) cc.topicName      = dbRow.topic_name;
        if (dbRow.topic_id       !== undefined) cc.topicId        = dbRow.topic_id;
        if (dbRow.sub_topic_name !== undefined) cc.subTopicName   = dbRow.sub_topic_name;
        if (dbRow.sub_topic_id   !== undefined) cc.subTopicId     = dbRow.sub_topic_id;
        if (dbRow.duration       !== undefined) cc.duration       = dbRow.duration;
        if (dbRow.quantity       !== undefined) cc.quantity       = dbRow.quantity;
        if (dbRow.total_questions!== undefined) cc.totalQuestions = dbRow.total_questions;
        if (dbRow.question_ids   !== undefined) cc.questionIds    = dbRow.question_ids;
        _check(await _supabase.from("exams").update(cc).eq("id", id), "updateExam-camelCase");
      } else {
        _check(res, "updateExam");
      }
    }
  },

  deleteExam: async (id) => {
    _check(await _supabase.from("exams").delete().eq("id", id), "deleteExam");
  },

  deleteExams: async (ids) => {
    _check(await _supabase.from("exams").delete().in("id", ids), "deleteExams");
  },

  subscribeExams: (cb) => {
    _supabase.from("exams").select("*").then(({ data }) => cb(_normalizeRows(data)));

    const channel = _supabase
      .channel(_ch("exams-all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "exams" }, async () => {
        const { data } = await _supabase.from("exams").select("*");
        cb(_normalizeRows(data || []));
      })
      .subscribe();
    return () => _supabase.removeChannel(channel);
  },
};

/* ═══════════════════════════════════════════════════════════════
   AUDIT LOGS  (table: auditLogs)
═══════════════════════════════════════════════════════════════ */
const _auditProvider = {
  logAdminAction: async (action, meta = {}, actorUid = null, actorEmail = null) => {
    try {
      await _supabase.from("auditLogs").insert({
        action,
        meta,
        actor_uid:   actorUid || "system",
        actor_email: actorEmail || null,
        created_at:  new Date().toISOString(),
      });
    } catch (e) {
      console.warn("[auditLog] failed:", e?.message);
    }
  },

  getRecentAuditLogs: async (max = 200, filter = {}) => {
    let q = _supabase
      .from("auditLogs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(max);
    if (filter.action)   q = q.eq("action", filter.action);
    if (filter.actorUid) q = q.eq("actor_uid", filter.actorUid);
    const { data } = _check(await q, "getRecentAuditLogs");
    return data;
  },
};

/* ═══════════════════════════════════════════════════════════════
   GENERIC COLLECTION HELPERS  (for DatabaseManagement)
═══════════════════════════════════════════════════════════════ */
const _collectionProvider = {
  getCollectionDocs: async (col) => {
    const { data } = _check(await _supabase.from(col).select("*"), "getCollectionDocs");
    return data;
  },

  getCollectionDocsByField: async (col, f, v) => {
    const { data } = _check(
      await _supabase.from(col).select("*").eq(f, v),
      "getCollectionDocsByField"
    );
    return data;
  },

  deleteCollectionDoc: async (col, id) => {
    _check(await _supabase.from(col).delete().eq("id", id), "deleteCollectionDoc");
  },

  deleteCollectionDocs: async (col, ids) => {
    _check(await _supabase.from(col).delete().in("id", ids), "deleteCollectionDocs");
  },

  fetchCollection: async (colId) => {
    const { data } = _check(
      await _supabase.from(colId).select("*"),
      "fetchCollection"
    );
    return (data || []).map(d => ({ _id: d.id || d.uid, ...d }));
  },

  writeCollection: async (colId, rows, onProgress) => {
    const cfg = _TABLE_IMPORT_CONFIG[colId];
    let written = 0;
    for (let i = 0; i < rows.length; i += 499) {
      const chunk = rows.slice(i, i + 499).map(doc => _transformForImport(colId, doc));
      _check(await _supabase.from(colId).upsert(chunk, {
        onConflict: cfg?.pk || "id",
      }), "writeCollection");
      written = Math.min(i + 499, rows.length);
      onProgress?.(written, rows.length);
    }
    return written;
  },

  writeCollectionMerge: async (colId, rows, conflictMode, onProgress) => {
    const cfg = _TABLE_IMPORT_CONFIG[colId];
    const pk = cfg?.pk || "id";
    let written = 0, failed = 0;
    for (let i = 0; i < rows.length; i += 499) {
      const chunk = rows.slice(i, i + 499).map(doc => _transformForImport(colId, doc));
      // Filter out empty rows (transform returned nothing)
      const valid = chunk.filter(r => r && Object.keys(r).length > 0);
      if (!valid.length) { failed += chunk.length; continue; }
      try {
        const res = await _supabase
          .from(colId)
          .upsert(valid, { onConflict: conflictMode === "merge" ? pk : undefined });
        if (res.error) {
          // Log exact Supabase error so it's visible in browser console
          console.error(`[import:${colId}] Supabase error:`, res.error.message, res.error.details || "", res.error.hint || "");
          console.error(`[import:${colId}] First row sample:`, JSON.stringify(valid[0]));
          failed += valid.length;
        } else {
          written += valid.length;
        }
      } catch (e) {
        console.error(`[import:${colId}] Exception:`, e?.message);
        failed += valid.length;
      }
    }
    onProgress?.(written, rows.length);
    return { written, failed };
  },

  countCollection: async (colId) => {
    try {
      const { count } = await _supabase.from(colId).select("*", { count: "exact", head: true });
      return count || 0;
    } catch { return 0; }
  },

  countCollectionByField: async (colId, field, value) => {
    try {
      const { count } = await _supabase
        .from(colId)
        .select("*", { count: "exact", head: true })
        .eq(field, value);
      return count || 0;
    } catch { return 0; }
  },

  deleteDocsByField: async (colId, field, value) => {
    _check(await _supabase.from(colId).delete().eq(field, value), "deleteDocsByField");
  },

  // No-op stubs kept for compatibility with DatabaseManagement component
  deleteDocRef: (colId, docId) => ({ colId, docId }),
  writeBatch: () => ({
    set:    () => {},
    delete: () => {},
    commit: async () => {},
  }),
};

/* ═══════════════════════════════════════════════════════════════
   GAMIFICATION  (table: gamification)
═══════════════════════════════════════════════════════════════ */
const BADGE_CATALOG_DATA = {
  "first-mock":    { label: "First Steps",    icon: "🎯", desc: "Completed your first mock test." },
  "streak-3":      { label: "On a Roll",       icon: "🔥", desc: "3-day practice streak." },
  "streak-7":      { label: "Unstoppable",     icon: "⚡", desc: "7-day practice streak." },
  "streak-30":     { label: "Iron Will",       icon: "🏆", desc: "30-day practice streak." },
  "centurion":     { label: "Centurion",       icon: "💯", desc: "Attempted 100+ questions in total." },
  "marathoner":    { label: "Marathoner",      icon: "🏃", desc: "Completed 25 mock tests." },
  "perfectionist": { label: "Perfectionist",   icon: "🌟", desc: "Scored 90%+ in a mock." },
  "sharpshooter":  { label: "Sharpshooter",    icon: "🎖️", desc: "Scored 100% in a mock." },
};

const _gamificationProvider = {
  BADGE_CATALOG: BADGE_CATALOG_DATA,

  getGamification: async (uid) => {
    if (!uid) return null;
    const { data } = _check(
      await _supabase.from("gamification").select("*").eq("uid", uid).maybeSingle(),
      "getGamification"
    );
    return data;
  },

  recordAttempt: async ({ uid, scorePct = 0, questionCount = 0 }) => {
    if (!uid) return null;
    const { data: prev } = await _supabase
      .from("gamification")
      .select("*")
      .eq("uid", uid)
      .maybeSingle();

    const today = todayKey();
    const last  = prev?.last_active_date || null;
    let streak  = prev?.current_streak || 0;
    if (!last) streak = 1;
    else {
      const gap = diffInDays(last, today);
      streak = gap === 0 ? (streak || 1) : gap === 1 ? streak + 1 : 1;
    }
    const totalAttempts  = (prev?.total_attempts  || 0) + 1;
    const totalQuestions = (prev?.total_questions || 0) + questionCount;
    const bestScorePct   = Math.max(prev?.best_score_pct || 0, Math.round(scorePct));
    const badges = new Set(prev?.badges || []);
    badges.add("first-mock");
    if (streak >= 3)           badges.add("streak-3");
    if (streak >= 7)           badges.add("streak-7");
    if (streak >= 30)          badges.add("streak-30");
    if (totalQuestions >= 100) badges.add("centurion");
    if (totalAttempts >= 25)   badges.add("marathoner");
    if (bestScorePct >= 90)    badges.add("perfectionist");
    if (bestScorePct >= 100)   badges.add("sharpshooter");

    const next = {
      uid,
      current_streak:  streak,
      longest_streak:  Math.max(prev?.longest_streak || 0, streak),
      last_active_date: today,
      total_attempts:  totalAttempts,
      total_questions: totalQuestions,
      best_score_pct:  bestScorePct,
      badges:          Array.from(badges),
      updated_at:      new Date().toISOString(),
    };
    _check(await _supabase.from("gamification").upsert(next), "recordAttempt");
    return next;
  },
};

/* ═══════════════════════════════════════════════════════════════
   STUDY PLANS  (table: studyPlans)
═══════════════════════════════════════════════════════════════ */
const _studyPlansProvider = {
  listStudyPlans: async (uid) => {
    if (!uid) return [];
    const { data } = _check(
      await _supabase
        .from("studyPlans")
        .select("*")
        .eq("uid", uid)
        .order("created_at", { ascending: false }),
      "listStudyPlans"
    );
    return data;
  },

  createStudyPlan: async (uid, plan) => {
    if (!uid) throw new Error("Not signed in");
    const { data: row } = _check(
      await _supabase
        .from("studyPlans")
        .insert({
          uid,
          title:                plan.title || "Untitled Plan",
          exam_id:              plan.examId || null,
          start_date:           plan.startDate || null,
          end_date:             plan.endDate || null,
          target_hours_per_day: Number(plan.targetHoursPerDay) || 2,
          tasks:                Array.isArray(plan.tasks) ? plan.tasks : [],
          created_at:           new Date().toISOString(),
        })
        .select("id")
        .single(),
      "createStudyPlan"
    );
    return row.id;
  },

  updateStudyPlan: async (uid, planId, patch) => {
    if (!uid) throw new Error("Not signed in");
    _check(
      await _supabase
        .from("studyPlans")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", planId)
        .eq("uid", uid),
      "updateStudyPlan"
    );
  },

  deleteStudyPlan: async (uid, planId) => {
    if (!uid) throw new Error("Not signed in");
    _check(
      await _supabase.from("studyPlans").delete().eq("id", planId).eq("uid", uid),
      "deleteStudyPlan"
    );
  },
};

/* ═══════════════════════════════════════════════════════════════
   REVISION
═══════════════════════════════════════════════════════════════ */
const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };
function _correctIndexOf(q) {
  if (typeof q.correctAnswer === "number") return q.correctAnswer;
  if (typeof q.correctAnswer === "string") return ANSWER_MAP[q.correctAnswer.trim().toUpperCase()] ?? 0;
  if (typeof q.answer === "string") return ANSWER_MAP[q.answer.trim().toUpperCase()] ?? 0;
  return 0;
}

const _revisionProvider = {
  getRevisionPool: async (uid, { maxResults = 50, maxQuestions = 200 } = {}) => {
    if (!uid) return { questions: [], stats: { totalWrong: 0, attempts: 0 } };

    const { data: results } = await _supabase
      .from("results")
      .select("answers, question_ids")
      .eq("user_id", uid)
      .order("submitted_at", { ascending: false })
      .limit(maxResults);

    if (!results?.length) return { questions: [], stats: { totalWrong: 0, attempts: 0 } };

    const wrongCounts = new Map();
    for (const r of results) {
      const answers = r.answers || {};
      (r.question_ids || []).forEach(id => {
        const ans = answers[id];
        wrongCounts.set(id, (wrongCounts.get(id) || 0) + (ans === undefined || ans === null ? 1 : 0.5));
      });
    }

    const candidateIds = [...wrongCounts.keys()].slice(0, maxQuestions);
    if (!candidateIds.length) return { questions: [], stats: { totalWrong: 0, attempts: results.length } };

    const { data: qDocs } = await _supabase
      .from("questions")
      .select("*")
      .in("id", candidateIds);

    const byId = new Map((qDocs || []).map(q => [q.id, q]));
    const wrong = [];
    for (const r of results) {
      const answers = r.answers || {};
      for (const id of r.question_ids || []) {
        const q = byId.get(id); if (!q) continue;
        const ans = answers[id];
        if (ans === undefined || ans === null) wrong.push({ ...q, _reason: "unattempted" });
        else if (ans !== _correctIndexOf(q))   wrong.push({ ...q, _reason: "wrong" });
      }
    }

    const map = new Map();
    for (const q of wrong) {
      const ex = map.get(q.id);
      if (!ex || (ex._reason === "unattempted" && q._reason === "wrong")) map.set(q.id, q);
    }
    return {
      questions: [...map.values()].slice(0, maxQuestions),
      stats: { totalWrong: map.size, attempts: results.length },
    };
  },
};

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS / MOCK GENERATOR  (table: analyticsEvents)
═══════════════════════════════════════════════════════════════ */
const _ANALYTICS_QUEUE = []; let _flushing = false;
const _analyticsProvider = {
  trackEvent: (name, payload = {}, uid = null) => {
    if (!name) return;
    _ANALYTICS_QUEUE.push({ name, payload, uid });
    setTimeout(async () => {
      if (_flushing) return; _flushing = true;
      try {
        while (_ANALYTICS_QUEUE.length) {
          const ev = _ANALYTICS_QUEUE.shift();
          try {
            await _supabase.from("analyticsEvents").insert({
              ...ev,
              created_at: new Date().toISOString(),
            });
          } catch {}
        }
      } finally { _flushing = false; }
    }, 0);
  },

  generateMocks: async ({ mockName, mockType, subject, topic, subTopic, subjectId, topicId, subTopicId, duration, questions }) => {
    if (!questions?.length) throw new Error("No questions found");
    const shuffled = shuffleArray(questions);
    const examData = {
      name:         mockName,
      mockType:     mockType || "sectional",
      subject:      subject || "",
      subjectId:    subjectId || "",
      topicName:    topic || "",
      topicId:      topicId || "",
      subTopicName: mockType === "sectional" ? (subTopic   || "") : "",
      subTopicId:   mockType === "sectional" ? (subTopicId || "") : "",
      duration:     Number(duration) || 0,
      quantity:     shuffled.length,
      totalQuestions: shuffled.length,
      questionIds:  shuffled.map(q => q.id),
      questions:    shuffled,
    };
    const id = await _examsProvider.createExam(examData);
    return { success: true, generatedMocks: [{ id, ...examData }] };
  },
};

/* ═══════════════════════════════════════════════════════════════
   PUBLIC PROVIDER — THE ONLY EXPORT
   Replace everything above with a different backend equivalent
   and this object stays the same shape. Nothing else changes.
═══════════════════════════════════════════════════════════════ */
export const provider = {
  /* auth */          ...(_authProvider),
  /* users */         ...(_usersProvider),
  /* subjects */      ...(_subjectsProvider),
  /* topics */        ...(_topicsProvider),
  /* subtopics */     ...(_subtopicsProvider),
  /* questions */     ...(_questionsProvider),
  /* results */       ...(_resultsProvider),
  /* bookmarks */     ...(_bookmarksProvider),
  /* forum */         ...(_forumProvider),
  /* exams */         ...(_examsProvider),
  /* audit */         ...(_auditProvider),
  /* generic */       ...(_collectionProvider),
  /* gamification */  ...(_gamificationProvider),
  /* study plans */   ...(_studyPlansProvider),
  /* revision */      ...(_revisionProvider),
  /* analytics */     ...(_analyticsProvider),
};
