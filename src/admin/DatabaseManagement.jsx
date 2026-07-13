// DatabaseManagement.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCollectionDocs,
  getCollectionDocsByField,
  deleteCollectionDoc,
  fetchCollection,
  writeCollection,
  writeCollectionMerge,
  countCollection,
  countCollectionByField,
  removeRecordsByField,
  getRecordRef,
  getWriteBatch,
} from "../data-layer";
import { useRole } from "../hooks/useRole";
import AdminLayout from "./AdminLayout";

/* ═══════════════════════════════════════════════════════════
   COLLECTION REGISTRY
═══════════════════════════════════════════════════════════ */
const ALL_COLLECTIONS = [
  { id: "users",          label: "Users",               icon: "👥", color: "blue",   userField: null },
  { id: "userAnalytics",  label: "User Analytics",      icon: "📊", color: "purple", userField: "userId" },
  { id: "examAttempts",   label: "Exam Attempts",       icon: "📝", color: "green",  userField: "userId" },
  { id: "results",        label: "Exam Results",        icon: "🏆", color: "yellow", userField: "userId" },
  { id: "subjects",       label: "Subjects",            icon: "📚", color: "blue",   userField: null },
  { id: "topics",         label: "Topics",              icon: "🗂️", color: "green",  userField: null },
  { id: "subtopics",      label: "Sub Topics",          icon: "🔖", color: "purple", userField: null },
  { id: "questions",      label: "Questions",           icon: "❓", color: "orange", userField: null },
  { id: "leaderboard",    label: "Leaderboard",         icon: "🥇", color: "yellow", userField: "userId" },
  { id: "notifications",  label: "Notifications",       icon: "🔔", color: "orange", userField: "userId" },
  { id: "activityLogs",   label: "Activity Logs",       icon: "📋", color: "blue",   userField: "userId" },
  { id: "roles",          label: "Roles & Permissions", icon: "🛡️", color: "red",    userField: null },
  { id: "settings",       label: "Settings",            icon: "⚙️", color: "blue",   userField: null },
  { id: "studyProgress",  label: "Study Progress",      icon: "📈", color: "green",  userField: "userId" },
  { id: "bookmarks",      label: "Bookmarks",           icon: "🔖", color: "purple", userField: "userId" },
  { id: "revisionLists",  label: "Revision Lists",      icon: "📄", color: "blue",   userField: "userId" },
  { id: "achievements",   label: "Achievements",        icon: "🎖️", color: "yellow", userField: "userId" },
];

const DATA_CATEGORIES = [
  { id: "account",     label: "Account Data",   icon: "👤", collections: ["users"] },
  { id: "exam",        label: "Exam Data",      icon: "📝", collections: ["examAttempts", "results"] },
  { id: "analytics",   label: "Analytics",      icon: "📊", collections: ["userAnalytics"] },
  { id: "activity",    label: "Activity Data",  icon: "📋", collections: ["activityLogs", "notifications"] },
  { id: "learning",    label: "Learning Data",  icon: "📚", collections: ["bookmarks", "revisionLists", "studyProgress", "achievements"] },
  { id: "leaderboard", label: "Leaderboard",    icon: "🥇", collections: ["leaderboard"] },
];

/* ═══════════════════════════════════════════════════════════
   UNIVERSAL DATA TYPE REGISTRY
═══════════════════════════════════════════════════════════ */
const TYPE_REGISTRY = {
  uuid:        { postgres: "UUID",          mysql: "CHAR(36)",      oracle: "VARCHAR2(36)",   sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  text:        { postgres: "TEXT",          mysql: "TEXT",          oracle: "CLOB",           sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  varchar:     { postgres: "VARCHAR(255)",  mysql: "VARCHAR(255)",  oracle: "VARCHAR2(255)",  sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  text_long:   { postgres: "TEXT",          mysql: "LONGTEXT",      oracle: "CLOB",           sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  integer:     { postgres: "INTEGER",       mysql: "INT",           oracle: "NUMBER(10)",     sqlite: "INTEGER", mongodb: "int",     nosql: "number"    },
  bigint:      { postgres: "BIGINT",        mysql: "BIGINT",        oracle: "NUMBER(19)",     sqlite: "INTEGER", mongodb: "long",    nosql: "number"    },
  float:       { postgres: "REAL",          mysql: "FLOAT",         oracle: "BINARY_FLOAT",   sqlite: "REAL",    mongodb: "double",  nosql: "number"    },
  double:      { postgres: "DOUBLE PRECISION", mysql: "DOUBLE",     oracle: "BINARY_DOUBLE",  sqlite: "REAL",    mongodb: "double",  nosql: "number"    },
  decimal:     { postgres: "DECIMAL(18,4)", mysql: "DECIMAL(18,4)", oracle: "NUMBER(18,4)",   sqlite: "REAL",    mongodb: "decimal", nosql: "number"    },
  boolean:     { postgres: "BOOLEAN",       mysql: "TINYINT(1)",    oracle: "NUMBER(1)",      sqlite: "INTEGER", mongodb: "bool",    nosql: "boolean"   },
  timestamp:   { postgres: "TIMESTAMPTZ",   mysql: "DATETIME",      oracle: "TIMESTAMP",      sqlite: "TEXT",    mongodb: "date",    nosql: "timestamp" },
  date:        { postgres: "DATE",          mysql: "DATE",          oracle: "DATE",           sqlite: "TEXT",    mongodb: "date",    nosql: "string"    },
  time:        { postgres: "TIME",          mysql: "TIME",          oracle: "VARCHAR2(8)",    sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  json:        { postgres: "JSONB",         mysql: "JSON",          oracle: "CLOB",           sqlite: "TEXT",    mongodb: "object",  nosql: "map"       },
  json_array:  { postgres: "JSONB",         mysql: "JSON",          oracle: "CLOB",           sqlite: "TEXT",    mongodb: "array",   nosql: "array"     },
  json_object: { postgres: "JSONB",         mysql: "JSON",          oracle: "CLOB",           sqlite: "TEXT",    mongodb: "object",  nosql: "map"       },
  binary:      { postgres: "BYTEA",         mysql: "BLOB",          oracle: "BLOB",           sqlite: "BLOB",    mongodb: "binData", nosql: "bytes"     },
  email:       { postgres: "VARCHAR(320)",  mysql: "VARCHAR(320)",  oracle: "VARCHAR2(320)",  sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  phone:       { postgres: "VARCHAR(20)",   mysql: "VARCHAR(20)",   oracle: "VARCHAR2(20)",   sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  url:         { postgres: "TEXT",          mysql: "VARCHAR(2048)", oracle: "VARCHAR2(2048)", sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
  enum:        { postgres: "TEXT",          mysql: "VARCHAR(64)",   oracle: "VARCHAR2(64)",   sqlite: "TEXT",    mongodb: "string",  nosql: "string"    },
};

const UNIVERSAL_TYPES = Object.keys(TYPE_REGISTRY);

const ENUM_WHITELIST = new Set([
  "role", "status", "difficulty", "language", "examType", "type",
  "category", "level", "tier", "plan", "gender", "visibility",
  "priority", "severity", "state", "mode", "scope", "permission",
]);

const ALWAYS_TEXT = new Set([
  "name", "title", "firstName", "lastName", "username", "displayName",
  "description", "question", "explanation", "answer", "correctAnswer",
  "address", "city", "country", "comment", "notes", "content", "body",
  "subject", "message", "key", "value", "label", "code",
]);

const ALWAYS_NUMERIC_HINT = new Set([
  "score", "rank", "count", "total", "timeTaken", "duration",
  "attempts", "marks", "totalQuestions", "correct", "wrong",
]);

/* ═══════════════════════════════════════════════════════════
   DATABASE ADAPTERS — delegated entirely to data-layer
═══════════════════════════════════════════════════════════ */
const DB_ADAPTER = {
  name: "Current Provider",
  icon: "🗄️",
  key: "provider",
  fetchCollection:  (colId, onP)              => fetchCollection(colId, onP),
  writeCollection:  (colId, rows, onP)        => writeCollection(colId, rows, onP),
  countCollection:  (colId)                   => countCollection(colId),
};

/* ═══════════════════════════════════════════════════════════
   VALUE NORMALIZATION & DATE HELPERS
═══════════════════════════════════════════════════════════ */
function isProviderTimestamp(v) {
  return v && typeof v === "object" && typeof v.seconds === "number" && typeof v.nanoseconds === "number";
}

function toDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (isProviderTimestamp(value)) return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(value)) {
      const d = new Date(value);
      return isNaN(d) ? null : d;
    }
  }
  return null;
}

function fmtDateTime(value) {
  const d = toDate(value);
  if (!d) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mon = months[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${mon}-${yr} ${hh}:${mm}`;
}

function fmtDateOnly(value) {
  const d = toDate(value);
  if (!d) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

/* ═══════════════════════════════════════════════════════════
   FK FIELD MAP + LABEL RESOLVER
   Resolves foreign-key IDs to human-readable labels.
═══════════════════════════════════════════════════════════ */
const FK_FIELD_TO_COLLECTION = {
  subjectId:  "subjects",
  topicId:    "topics",
  subTopicId: "subtopics",
  subtopicId: "subtopics",
  userId:     "users",
  uid:        "users",
  examId:     "examAttempts",
  questionId: "questions",
  roleId:     "roles",
  createdBy:  "users",
  updatedBy:  "users",
  assignedTo: "users",
  ownerId:    "users",
};

/** Pick the best display label from a row of a referenced collection. */
function pickLabel(row) {
  if (!row) return null;
  // Users: prefer full name, fall back to email/username
  if (row.firstName || row.lastName) {
    return `${row.firstName || ""} ${row.lastName || ""}`.trim();
  }
  return row.name || row.title || row.displayName || row.username
    || row.email || row.label || row.key || null;
}

/** Build a lookup map: collectionId → { docId → label } */
function buildLookupMap(rowsByCollection) {
  const lookup = {};
  for (const [colId, rows] of Object.entries(rowsByCollection || {})) {
    const m = {};
    for (const r of rows || []) {
      const id = r._id || r.uid || r.id;
      if (id) m[id] = pickLabel(r) || String(id).slice(0, 8) + "…";
    }
    lookup[colId] = m;
  }
  return lookup;
}

/** Determine if a field key is an FK reference. */
function fkTargetCollection(fieldKey) {
  if (!fieldKey) return null;
  if (FK_FIELD_TO_COLLECTION[fieldKey]) return FK_FIELD_TO_COLLECTION[fieldKey];
  return null;
}

/* ═══════════════════════════════════════════════════════════
   CELL RENDERER (with FK resolution)
═══════════════════════════════════════════════════════════ */
function renderCellValue(value, fieldKey, lookups) {
  if (value === null || value === undefined || value === "") return "—";

  if (isProviderTimestamp(value)) return fmtDateTime(value);

  if (fieldKey && /^(createdAt|updatedAt|lastLogin|lastSeen|lastActivity|timestamp|date|expiresAt|deletedAt|earnedAt|submittedAt|completedAt|startedAt|endedAt)$/i.test(fieldKey)) {
    const d = toDate(value);
    if (d) return fmtDateTime(value);
  }

  // FK resolution
  const targetCol = fkTargetCollection(fieldKey);
  if (targetCol && typeof value === "string" && lookups?.[targetCol]) {
    const label = lookups[targetCol][value];
    if (label) return label;
    // No match found, show short id
    return value.length > 14 ? value.slice(0, 10) + "…" : value;
  }

  if (typeof value === "boolean") return value ? "✓ Yes" : "✕ No";

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every(v => typeof v !== "object")) {
      const joined = value.join(", ");
      return joined.length > 60 ? joined.slice(0, 57) + "…" : joined;
    }
    return `[${value.length} items]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    return `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", …" : ""}}`;
  }

  const str = String(value);
  // Truncate long opaque IDs
  if (str.length > 40 && /^[a-zA-Z0-9_-]+$/.test(str)) {
    return str.slice(0, 14) + "…";
  }
  return str;
}

/* ═══════════════════════════════════════════════════════════
   SCHEMA INFERENCE
═══════════════════════════════════════════════════════════ */
const ID_LIKE = /(^_?id$)|(Id$)|(^uid$)|(^.*_id$)/;
const DATE_FIELD_HINT = /(At|_at|Date|date|Time|time|timestamp|Timestamp)$/;

function inferValueType(value, fieldKey) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return "boolean";

  if (isProviderTimestamp(value)) return "timestamp";

  if (typeof value === "number") {
    if (fieldKey && DATE_FIELD_HINT.test(fieldKey)) {
      if (value > 1e9 && value < 4e12) return "timestamp";
    }
    return Number.isInteger(value) ? "integer" : "float";
  }

  if (Array.isArray(value)) return "json_array";

  if (typeof value === "object") return "json_object";

  if (typeof value === "string") {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return "uuid";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
    if (/^\+?[\d\s\-()]{7,15}$/.test(value) && fieldKey && /phone|mobile/i.test(fieldKey)) return "phone";
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "timestamp";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
    if (/^(http|https):\/\//.test(value)) return "url";
    if (value.length > 500) return "text_long";
    return "text";
  }
  return "unknown";
}

function mergeTypes(a, b) {
  if (a === b) return a;
  if (a === "null") return b;
  if (b === "null") return a;
  if (a === "text_long" || b === "text_long") return "text_long";
  if ((a === "integer" && b === "float") || (a === "float" && b === "integer")) return "float";
  if ((a === "timestamp" && (b === "integer" || b === "text")) ||
      (b === "timestamp" && (a === "integer" || a === "text"))) return "timestamp";
  return "text";
}

const FK_PATTERNS = {
  subjectId:  { references: "subjects",     onDelete: "CASCADE",  onUpdate: "CASCADE" },
  topicId:    { references: "topics",       onDelete: "CASCADE",  onUpdate: "CASCADE" },
  subTopicId: { references: "subtopics",    onDelete: "CASCADE",  onUpdate: "CASCADE" },
  userId:     { references: "users",        onDelete: "CASCADE",  onUpdate: "CASCADE" },
  uid:        { references: "users",        onDelete: "CASCADE",  onUpdate: "CASCADE" },
  examId:     { references: "examAttempts", onDelete: "SET NULL", onUpdate: "CASCADE" },
  questionId: { references: "questions",    onDelete: "SET NULL", onUpdate: "CASCADE" },
};

const UNIQUE_FIELDS = {
  users:    [["email"], ["uid"], ["username"]],
  subjects: [["name"]],
  topics:   [["subjectId", "name"]],
  subtopics:[["topicId", "name"]],
  roles:    [["name"]],
  settings: [["key"]],
};

const INDEX_FIELDS = {
  users:        ["email", "uid", "role", "status"],
  subjects:     ["name"],
  topics:       ["name", "subjectId"],
  subtopics:    ["name", "topicId", "subjectId"],
  questions:    ["subjectId", "topicId", "subTopicId", "difficulty"],
  examAttempts: ["userId", "subjectId"],
  results:      ["userId", "score"],
  userAnalytics:["userId"],
  leaderboard:  ["userId", "score", "rank"],
  activityLogs: ["userId", "action"],
  notifications:["userId", "read"],
  bookmarks:    ["userId", "questionId"],
  revisionLists:["userId"],
  studyProgress:["userId", "subjectId"],
  achievements: ["userId"],
};

function shouldBeEnum(fieldKey, valueSet, inferredType) {
  if (!fieldKey) return false;
  if (ALWAYS_TEXT.has(fieldKey)) return false;
  if (ALWAYS_NUMERIC_HINT.has(fieldKey)) return false;
  if (ID_LIKE.test(fieldKey)) return false;
  if (fieldKey in FK_PATTERNS) return false;
  if (inferredType !== "text") return false;

  if (ENUM_WHITELIST.has(fieldKey) && valueSet.size > 0 && valueSet.size <= 12) {
    const allShort = [...valueSet].every(v => String(v).length <= 32);
    return allShort;
  }

  return false;
}

function inferCollectionSchema(colId, rows) {
  if (!rows || rows.length === 0) {
    return {
      tableName: colId, collectionName: colId, primaryKey: "_id",
      columns: {
        _id: { type: "uuid", nullable: false, required: true, defaultValue: null, generated: true, identity: true, autoIncrement: false },
      },
      indexes: [], uniqueConstraints: [], foreignKeys: {},
      isEmpty: true,
    };
  }

  const sample = rows.slice(0, 300);
  const fieldTypes = {};
  const fieldNullCount = {};
  const fieldValueSets = {};

  for (const row of sample) {
    for (const [key, val] of Object.entries(row)) {
      const t = inferValueType(val, key);
      if (!(key in fieldTypes)) {
        fieldTypes[key] = t;
        fieldNullCount[key] = 0;
        fieldValueSets[key] = new Set();
      } else {
        fieldTypes[key] = mergeTypes(fieldTypes[key], t);
      }
      if (t === "null") fieldNullCount[key]++;
      else if (fieldValueSets[key].size < 30 && typeof val !== "object") {
        fieldValueSets[key].add(String(val));
      }
    }
  }

  const columns = {};
  for (const [field, type] of Object.entries(fieldTypes)) {
    const nullRate = fieldNullCount[field] / sample.length;
    let resolvedType = type === "null" ? "text" : type;

    if (shouldBeEnum(field, fieldValueSets[field], resolvedType)) {
      resolvedType = "enum";
    }

    if (field === "_id") {
      const vals = [...fieldValueSets[field]];
      const looksUuid = vals.length > 0 && vals.every(v =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
      );
      resolvedType = looksUuid ? "uuid" : "text";
    }

    const nullable = field === "_id" ? false : nullRate > 0.05;
    columns[field] = {
      type: resolvedType,
      nullable,
      required: !nullable,
      defaultValue:
        field === "_id" ? null
        : resolvedType === "boolean" ? false
        : ["integer","float","bigint","double","decimal"].includes(resolvedType) ? 0
        : ["text","varchar","enum","email"].includes(resolvedType) ? ""
        : null,
      generated:     field === "_id",
      identity:      field === "_id",
      autoIncrement: false,
      ...(resolvedType === "enum" && { enumValues: [...fieldValueSets[field]] }),
    };
  }

  if (!columns._id) {
    columns._id = { type: "uuid", nullable: false, required: true, defaultValue: null, generated: true, identity: true, autoIncrement: false };
  }

  const indexes = (INDEX_FIELDS[colId] || []).filter(f => f in columns);

  const uniqueConstraints = (UNIQUE_FIELDS[colId] || [])
    .filter(cols => cols.every(c => c in columns))
    .map(cols => cols.length === 1 ? cols[0] : { composite: cols, name: `uq_${colId}_${cols.join("_")}` });

  const foreignKeys = {};
  for (const [field, fk] of Object.entries(FK_PATTERNS)) {
    if (!(field in columns)) continue;
    if (fk.references === colId) continue;
    if (field === "_id") continue;
    foreignKeys[field] = { references: `${fk.references}._id`, onDelete: fk.onDelete, onUpdate: fk.onUpdate };
  }

  return { tableName: colId, collectionName: colId, primaryKey: "_id", columns, indexes, uniqueConstraints, foreignKeys, isEmpty: false };
}

/* ═══════════════════════════════════════════════════════════
   CHECKSUM ENGINE — enhanced with algorithm metadata
═══════════════════════════════════════════════════════════ */
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function buildChecksums(dataMap, schemaMap, relationshipsObj, permissionsObj) {
  const dataHashes = {};
  for (const [colId, rows] of Object.entries(dataMap)) {
    dataHashes[colId] = await sha256(JSON.stringify(rows));
  }
  return {
    algorithm: "SHA256",
    schemaHash:        await sha256(JSON.stringify(schemaMap)),
    relationshipsHash: await sha256(JSON.stringify(relationshipsObj)),
    permissionsHash:   await sha256(JSON.stringify(permissionsObj)),
    dataHashes,
    // Legacy aliases for backward compatibility with old .udb files
    schemaSha256:        null,
    relationshipsSha256: null,
    permissionsSha256:   null,
    data: dataHashes,
  };
}

/* ═══════════════════════════════════════════════════════════
   UDB PACKAGE ENGINE
═══════════════════════════════════════════════════════════ */
const UDB_ENGINE_VERSION = "2.3.0";
const UDB_FORMAT_VERSION = "2.3";

function buildManifest(collectionIds, totalRecords, perCollectionCounts, emptyCollections) {
  return {
    application: "Sravya Technologies — UGC NET Odia",
    backupVersion: UDB_FORMAT_VERSION,
    sourceDatabaseType: DB_ADAPTER.name,
    sourceDatabaseIcon: DB_ADAPTER.icon,
    exportTimestamp: new Date().toISOString(),
    databaseVersion: "1.0",
    totalCollections: collectionIds.length,
    totalRecords,
    perCollectionCounts: perCollectionCounts || {},
    emptyCollections: emptyCollections || [],
    backupEngineVersion: UDB_ENGINE_VERSION,
    generator: "DatabaseManagement.jsx / Universal Database Backup Engine v2.3",
    collections: collectionIds,
    typeRegistry: UNIVERSAL_TYPES,
    compatibility: {
      targets: ["Firebase","Supabase","PostgreSQL","MySQL","Oracle","MongoDB","SQLite"],
      minEngineVersion: "2.3.0",
    },
  };
}

function buildRelationships() {
  return {
    foreignKeys: {
      topics:        { subjectId:  { references: "subjects._id",   onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      subtopics:     { subjectId:  { references: "subjects._id",   onDelete: "CASCADE",  onUpdate: "CASCADE"  },
                       topicId:    { references: "topics._id",     onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      questions:     { subjectId:  { references: "subjects._id",   onDelete: "CASCADE",  onUpdate: "CASCADE"  },
                       topicId:    { references: "topics._id",     onDelete: "CASCADE",  onUpdate: "CASCADE"  },
                       subTopicId: { references: "subtopics._id",  onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      examAttempts:  { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      results:       { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      userAnalytics: { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      leaderboard:   { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      notifications: { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      activityLogs:  { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      bookmarks:     { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      revisionLists: { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      studyProgress: { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
      achievements:  { userId:     { references: "users._id",      onDelete: "CASCADE",  onUpdate: "CASCADE"  } },
    },
    parentChild: {
      subjects:  { children: ["topics", "subtopics", "questions"] },
      topics:    { parent: "subjects", children: ["subtopics", "questions"] },
      subtopics: { parent: "topics",   children: ["questions"] },
      users:     { children: ["examAttempts","results","userAnalytics","leaderboard","notifications","activityLogs","bookmarks","revisionLists","studyProgress","achievements"] },
    },
    cascadeRules:  { default: "CASCADE" },
    restrictRules: { users: ["examAttempts","results"] },
  };
}

function buildPermissions() {
  return {
    roles: {
      "super-admin": { permissions: ["create","read","update","delete","export","import","backup","restore","admin"], rowAccess: "ALL", description: "Full unrestricted access" },
      "admin":       { permissions: ["create","read","update","delete","export","import","backup"], rowAccess: "ALL", description: "Full data access except system restore" },
      "teacher":     { permissions: ["read","create","update"], rowAccess: "OWN_AND_ASSIGNED", description: "Can manage content they created" },
      "student":     { permissions: ["read"], rowAccess: "OWN_ONLY", description: "Read-only access to own data" },
    },
    rowAccessDefinitions: {
      OWN_ONLY:         "WHERE userId = currentUser.id",
      OWN_AND_ASSIGNED: "WHERE userId = currentUser.id OR assignedTo = currentUser.id",
      ALL:              "no restriction",
    },
    databaseIndependentSecurityModel: "RBAC_v1",
  };
}

function buildValidation(dataMap, schemaMap, checksums) {
  const validation = {};
  for (const [colId, rows] of Object.entries(dataMap)) {
    validation[colId] = {
      expectedRecordCount: rows.length,
      isEmpty: rows.length === 0,
      schemaHash: checksums?.schemaHash || null,
      dataHash: checksums?.dataHashes?.[colId] || null,
      integrityRules: [
        { rule: "primaryKeyNotNull", field: "_id" },
        ...(schemaMap[colId]?.uniqueConstraints || []).map(f =>
          typeof f === "string" ? { rule: "unique", field: f } : { rule: "uniqueComposite", fields: f.composite }
        ),
        ...(schemaMap[colId]?.indexes || []).map(f => ({ rule: "indexed", field: f })),
      ],
    };
  }
  return validation;
}

function buildMigration(collectionIds) {
  return {
    sourceDatabaseType: DB_ADAPTER.name,
    exportVersion: UDB_FORMAT_VERSION,
    engineVersion: UDB_ENGINE_VERSION,
    exportedCollections: collectionIds,
    typeRegistry: TYPE_REGISTRY,
    compatibility: {
      Firebase:    { supported: true,  notes: "Native format" },
      Supabase:    { supported: true,  notes: "Map collections to tables; uuid → uuid primary keys" },
      PostgreSQL:  { supported: true,  notes: "Map collections to tables; json_array → jsonb" },
      MySQL:       { supported: true,  notes: "Map collections to tables; json_array → JSON" },
      Oracle:      { supported: true,  notes: "Map collections to tables; text_long → CLOB" },
      MongoDB:     { supported: true,  notes: "Collections map directly; _id preserved" },
      SQLite:      { supported: true,  notes: "Map collections to tables; timestamp → TEXT" },
    },
    migrationNotes: [
      "Timestamps preserved as ISO 8601 strings or epoch milliseconds for cross-DB compatibility.",
      "Enum fields include extracted enumValues array for SQL CREATE TYPE statements.",
      "Composite unique constraints encoded as { composite: [field1, field2], name: 'uq_...' }.",
      "Primary keys (_id) are never treated as foreign keys or enums.",
      "Empty collections retain schema definitions but have an empty data array.",
    ],
  };
}

async function buildUDBPackage(collectionIds, dataMap) {
  const totalRecords = Object.values(dataMap).reduce((s, r) => s + r.length, 0);
  const perCollectionCounts = Object.fromEntries(Object.entries(dataMap).map(([k, v]) => [k, v.length]));
  const emptyCollections = Object.entries(dataMap).filter(([_, v]) => v.length === 0).map(([k]) => k);

  const schemaMap = {};
  for (const colId of collectionIds) {
    schemaMap[colId] = inferCollectionSchema(colId, dataMap[colId] || []);
  }

  const relationships = buildRelationships();
  const permissions   = buildPermissions();
  const checksums     = await buildChecksums(dataMap, schemaMap, relationships, permissions);
  const validation    = buildValidation(dataMap, schemaMap, checksums);
  const migration     = buildMigration(collectionIds);
  const manifest      = buildManifest(collectionIds, totalRecords, perCollectionCounts, emptyCollections);

  return { manifest, schema: schemaMap, relationships, permissions, validation, checksums, migration, data: dataMap };
}

/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */
async function validateUDBPackage(pkg) {
  const warnings = [], errors = [];

  if (!pkg.manifest?.application)        errors.push("❌ Missing application name in manifest.");
  if (!pkg.manifest?.backupVersion)       errors.push("❌ Missing backupVersion in manifest.");
  if (!pkg.manifest?.exportTimestamp)     errors.push("❌ Missing exportTimestamp in manifest.");
  if (!pkg.manifest?.sourceDatabaseType)  errors.push("❌ Missing sourceDatabaseType in manifest.");
  if (!pkg.manifest?.backupEngineVersion) errors.push("❌ Missing backupEngineVersion in manifest.");

  if (!pkg.schema) errors.push("❌ Missing schema section.");
  else {
    for (const [colId, sch] of Object.entries(pkg.schema)) {
      if (!sch.primaryKey) warnings.push(`⚠️ ${colId}: missing primaryKey in schema.`);
      if (!sch.columns || Object.keys(sch.columns).length === 0)
        errors.push(`❌ ${colId}: empty columns in schema.`);
    }
  }

  if (!pkg.data) errors.push("❌ Missing data section.");
  else {
    for (const [colId, rows] of Object.entries(pkg.data)) {
      if (!Array.isArray(rows)) { errors.push(`❌ ${colId}: data is not an array.`); continue; }
      if (rows.length === 0) warnings.push(`ℹ️ ${colId}: 0 records — empty collection (schema will be created).`);
      const ids = rows.map(r => r._id).filter(Boolean);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (dupes.length > 0) warnings.push(`⚠️ ${colId}: ${dupes.length} duplicate _id(s).`);
      const known = ALL_COLLECTIONS.find(c => c.id === colId);
      if (!known) warnings.push(`⚠️ "${colId}" is not a registered collection — will be created.`);
    }
  }

  if (pkg.checksums && pkg.schema && pkg.relationships && pkg.data) {
    const c = pkg.checksums;
    // Support both new (schemaHash) and legacy (schemaSha256) field names
    const schemaHash = c.schemaHash || c.schemaSha256;
    const relHash    = c.relationshipsHash || c.relationshipsSha256;
    const permHash   = c.permissionsHash || c.permissionsSha256;
    const dataHashes = c.dataHashes || c.data || {};

    const recomputedSchema = await sha256(JSON.stringify(pkg.schema));
    if (schemaHash && schemaHash !== recomputedSchema)
      errors.push("❌ Schema checksum mismatch.");
    if (relHash) {
      const r = await sha256(JSON.stringify(pkg.relationships));
      if (relHash !== r) errors.push("❌ Relationships checksum mismatch.");
    }
    if (permHash && pkg.permissions) {
      const p = await sha256(JSON.stringify(pkg.permissions));
      if (permHash !== p) errors.push("❌ Permissions checksum mismatch.");
    }
    for (const [colId, rows] of Object.entries(pkg.data)) {
      const expected = dataHashes[colId];
      if (expected) {
        const recomputed = await sha256(JSON.stringify(rows));
        if (expected !== recomputed) errors.push(`❌ Checksum mismatch for ${colId} data.`);
      }
    }
    if (errors.filter(e => e.toLowerCase().includes("checksum")).length === 0 && schemaHash) {
      warnings.push(`✅ All checksums verified (${c.algorithm || "SHA256"}).`);
    }
  } else {
    warnings.push("⚠️ No checksums — integrity verification skipped.");
  }

  return { ok: errors.length === 0, warnings, errors };
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function serializeUDB(pkg) { return JSON.stringify(pkg, null, 2); }

function parseUDB(text) {
  const pkg = JSON.parse(text);
  if (!pkg.manifest || !pkg.data) throw new Error("Invalid .udb file: missing manifest or data sections.");
  if (!pkg.schema) throw new Error("Invalid .udb file: missing schema section.");
  return pkg;
}

function toCSV(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map(r => keys.map(k => esc(r[k])).join(","))].join("\n");
}

function toSQL(colId, rows, schema, dialect = "mysql") {
  if (!rows.length) return `-- No records in ${colId}\n`;
  const cols = Object.keys(rows[0]);
  const colDefs = cols.map(c => {
    const def = schema?.columns?.[c];
    const sqlType = def ? (TYPE_REGISTRY[def.type]?.[dialect] || "TEXT") : "TEXT";
    const nullPart = def?.nullable === false ? " NOT NULL" : "";
    return `  \`${c}\` ${sqlType}${nullPart}`;
  });
  const pkPart = schema?.primaryKey ? `,\n  PRIMARY KEY (\`${schema.primaryKey}\`)` : "";
  const create = `CREATE TABLE IF NOT EXISTS \`${colId}\` (\n${colDefs.join(",\n")}${pkPart}\n);\n\n`;
  const inserts = rows.map(r =>
    `INSERT INTO \`${colId}\` VALUES (${cols.map(c => `'${String(r[c] ?? "").replace(/'/g, "''")}'`).join(", ")});`
  ).join("\n");
  return create + inserts + "\n";
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════
   FIELD LABEL MAP — covers all known fields with friendly names
═══════════════════════════════════════════════════════════ */
const FIELD_LABELS = {
  // Identity / user
  uid: "User ID",
  email: "Email",
  firstName: "First Name",
  lastName: "Last Name",
  username: "Username",
  displayName: "Display Name",
  phone: "Phone",
  role: "Role",
  status: "Status",
  isOnline: "Online",

  // Timestamps
  createdAt: "Created",
  updatedAt: "Updated",
  lastLogin: "Last Login",
  lastSeen: "Last Seen",
  lastActivity: "Last Activity",
  submittedAt: "Submitted",
  completedAt: "Completed",
  startedAt: "Started",
  endedAt: "Ended",
  earnedAt: "Earned",
  timestamp: "Time",
  expiresAt: "Expires",

  // FK fields → friendly labels (drop "ID" suffix)
  subjectId: "Subject",
  topicId: "Topic",
  subTopicId: "Sub Topic",
  subtopicId: "Sub Topic",
  userId: "User",
  examId: "Exam",
  questionId: "Question",
  roleId: "Role",
  createdBy: "Created By",
  updatedBy: "Updated By",
  assignedTo: "Assigned To",
  ownerId: "Owner",

  // Content
  question: "Question",
  options: "Options",
  correctAnswer: "Correct Answer",
  answer: "Answer",
  answers: "Answers",
  difficulty: "Difficulty",
  language: "Language",
  explanation: "Explanation",
  name: "Name",
  title: "Title",
  description: "Description",
  message: "Message",

  // Exam / score
  score: "Score",
  totalQuestions: "Total Questions",
  totalMarks: "Total Marks",
  marksObtained: "Marks Obtained",
  timeTaken: "Time Taken",
  duration: "Duration",
  attempts: "Attempts",
  rank: "Rank",
  percentage: "Percentage",
  correct: "Correct",
  wrong: "Wrong",
  skipped: "Skipped",
  examType: "Exam Type",

  // Activity
  action: "Action",
  read: "Read",
  category: "Category",
  type: "Type",
  level: "Level",
  progress: "Progress",
  key: "Key",
  value: "Value",
};

function humanField(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  // Strip Id/ID suffixes and convert camelCase to Title Case
  const stripped = key.replace(/Id$/, "").replace(/ID$/, "");
  return stripped
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const VIEWS = {
  OVERVIEW: "overview", EXPLORER: "explorer", USERS: "users",
  DELETE: "delete", EXPORT: "export", IMPORT: "import",
  BACKUP: "backup", ANALYTICS: "analytics",
};

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════ */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`um-toast um-toast--${toast.type}`}>
      {toast.type === "success" ? "✓" : "✕"} {toast.msg}
    </div>
  );
}

function ProgressBar({ value, max, label, color = "blue" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="udb-progress-wrap">
      {label && <div className="udb-progress-label">{label}</div>}
      <div className="udb-progress-track">
        <div className={`udb-progress-fill udb-progress-fill--${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="udb-progress-pct">{Math.round(pct)}%</div>
    </div>
  );
}

function StepBadge({ n, active, done }) {
  return (
    <span className={`udb-step-badge${active ? " udb-step-badge--active" : ""}${done ? " udb-step-badge--done" : ""}`}>
      {done ? "✓" : n}
    </span>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, danger, affectedInfo, confirmLabel, totalAffected }) {
  if (!open) return null;
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className={`popup dbm-popup-confirm${danger ? " dbm-popup-danger" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="dbm-confirm-icon">{danger ? "⚠️" : "❓"}</div>
        <h3 className="dbm-confirm-title">{title}</h3>
        <p className="dbm-confirm-msg">{message}</p>
        {typeof totalAffected === "number" && (
          <div className="dbm-affected-counter">
            <span className="dbm-affected-counter-label">Records to be erased</span>
            <span className="dbm-affected-counter-value">{totalAffected.toLocaleString()}</span>
          </div>
        )}
        {affectedInfo && (
          <div className="dbm-confirm-affected">
            {affectedInfo.map((line, i) => <div key={i} className="dbm-confirm-affected-row">{line}</div>)}
          </div>
        )}
        {danger && (
          <div className="dbm-danger-warning">
            🔴 This action is <strong>permanent and irreversible</strong>. All data will be permanently removed.
          </div>
        )}
        <div className="dbm-confirm-actions">
          <button className="btn btn-secondary btn-sm cancel-btn" onClick={onClose}>Cancel</button>
          <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            {confirmLabel || (danger ? "Delete Permanently" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessPopup({ open, onClose, title, lines, ts }) {
  if (!open) return null;
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup dbm-popup-success" onClick={e => e.stopPropagation()}>
        <div className="dbm-confirm-icon dbm-success-icon-spin">✅</div>
        <h3 className="dbm-confirm-title">{title}</h3>
        {ts && <p className="dbm-confirm-msg">{fmtDateTime(ts)}</p>}
        <div className="udb-report udb-report--success dbm-success-report">
          <div className="udb-report-body">
            {lines.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
        <div className="dbm-confirm-actions">
          <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "blue", loading }) {
  return (
    <div className={`dbm-stat-card dbm-stat-card--${color}`}>
      <span className="dbm-stat-icon">{icon}</span>
      <div className="dbm-stat-body">
        <div className="dbm-stat-value">
          {loading ? <span className="dbm-skeleton dbm-skeleton--sm" /> : (value ?? "—")}
        </div>
        <div className="dbm-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: OVERVIEW
═══════════════════════════════════════════════════════════ */
function OverviewView({ stats, statsLoading, setView }) {
  const cards = [
    { icon: "🗂️", label: "Collections",    value: ALL_COLLECTIONS.length, color: "blue" },
    { icon: "📄", label: "Total Documents", value: stats.totalDocs,        color: "purple" },
    { icon: "👥", label: "Total Users",     value: stats.users,            color: "green" },
    { icon: "📝", label: "Exam Attempts",   value: stats.examAttempts,     color: "yellow" },
    { icon: "🏆", label: "Total Results",   value: stats.results,          color: "orange" },
    { icon: "❓", label: "Questions",       value: stats.questions,        color: "red" },
    { icon: "📚", label: "Subjects",        value: stats.subjects,         color: "blue" },
    { icon: "🗂️", label: "Topics",          value: stats.topics,           color: "purple" },
    { icon: "🔖", label: "Sub Topics",      value: stats.subtopics,        color: "green" },
    { icon: "📊", label: "Analytics",       value: stats.userAnalytics,    color: "yellow" },
  ];

  const actions = [
    { icon: "🗄️", label: "Explorer",       view: VIEWS.EXPLORER,  desc: "Browse all collections" },
    { icon: "👥", label: "User Manager",   view: VIEWS.USERS,     desc: "View per-user data" },
    { icon: "🗑️", label: "Delete Manager", view: VIEWS.DELETE,    desc: "Granular deletion" },
    { icon: "📦", label: "Export / UDB",   view: VIEWS.EXPORT,    desc: "JSON, CSV, SQL, .udb" },
    { icon: "📥", label: "Import / UDB",   view: VIEWS.IMPORT,    desc: "Import any format" },
    { icon: "💾", label: "Backup",         view: VIEWS.BACKUP,    desc: "Backup & Restore" },
    { icon: "📈", label: "Analytics",      view: VIEWS.ANALYTICS, desc: "Growth & usage" },
  ];

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Database Overview</h2>
        <p className="dbm-view-subtitle">Live document counts and quick-access actions · {DB_ADAPTER.icon} {DB_ADAPTER.name}</p>
      </div>
      <div className="dbm-stat-grid">
        {cards.map(c => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} color={c.color} loading={statsLoading} />
        ))}
      </div>
      <div className="dbm-section-title">Quick Actions</div>
      <div className="dbm-action-grid">
        {actions.map(a => (
          <button key={a.view} className="dbm-action-tile" onClick={() => setView(a.view)}>
            <span className="dbm-action-tile-icon">{a.icon}</span>
            <span className="dbm-action-tile-label">{a.label}</span>
            <span className="dbm-action-tile-desc">{a.desc}</span>
          </button>
        ))}
      </div>
      <div className="dbm-section-title">Collections Registry</div>
      <div className="dbm-col-list">
        {ALL_COLLECTIONS.map(col => (
          <div key={col.id} className="dbm-col-item">
            <span className="dbm-col-icon">{col.icon}</span>
            <span className="dbm-col-label">{col.label}</span>
            <span className={`dbm-col-count dbm-col-count--${col.color}`}>
              {statsLoading ? "…" : (stats[col.id] ?? 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: EXPLORER — clean headers, FK resolution, all collections
═══════════════════════════════════════════════════════════ */

/* Per-collection preferred column order */
const EXPLORER_COLUMNS = {
  users:        ["firstName", "lastName", "username", "phone", "email", "role", "status", "lastLogin"],
  subjects:     ["name", "description", "createdAt"],
  topics:       ["name", "subjectId", "description", "createdAt"],
  subtopics:    ["name", "topicId", "subjectId", "createdAt"],
  questions:    ["question", "correctAnswer", "difficulty", "language", "subjectId", "topicId"],
  examAttempts: ["userId", "subjectId", "score", "totalQuestions", "timeTaken", "submittedAt", "createdAt"],
  results:      ["userId", "subjectId", "score", "totalQuestions", "percentage", "createdAt"],
  userAnalytics:["userId", "totalAttempts", "averageScore", "lastActivity"],
  leaderboard:  ["userId", "score", "rank", "subjectId", "updatedAt"],
  notifications:["userId", "title", "message", "read", "createdAt"],
  activityLogs: ["userId", "action", "category", "createdAt", "timestamp"],
  bookmarks:    ["userId", "questionId", "subjectId", "createdAt"],
  revisionLists:["userId", "name", "createdAt"],
  studyProgress:["userId", "subjectId", "progress", "lastActivity"],
  achievements: ["userId", "name", "category", "earnedAt"],
};

/** FK collections needed across all explorer collections */
const FK_COLLECTIONS_TO_PREFETCH = ["users", "subjects", "topics", "subtopics", "questions"];

function ExplorerView() {
  const [active, setActive]   = useState(ALL_COLLECTIONS[0].id);
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [lookups, setLookups] = useState({});
  const [lookupsLoaded, setLookupsLoaded] = useState(false);
  const PAGE_SIZE = 20;

  // Preload FK lookup data once
  useEffect(() => {
    (async () => {
      const map = {};
      for (const colId of FK_COLLECTIONS_TO_PREFETCH) {
        try {
          map[colId] = await DB_ADAPTER.fetchCollection(colId);
        } catch {
          map[colId] = [];
        }
      }
      // Also build lookups keyed by `uid` for users (because userId fields often store uid)
      const lookup = buildLookupMap(map);
      // Augment users lookup with uid → label mapping
      if (map.users) {
        for (const u of map.users) {
          if (u.uid) lookup.users[u.uid] = pickLabel(u) || u.uid.slice(0, 8) + "…";
        }
      }
      setLookups(lookup);
      setLookupsLoaded(true);
    })();
  }, []);

  const load = async (colId) => {
    setLoading(true); setSearch(""); setPage(1);
    try { setRows(await DB_ADAPTER.fetchCollection(colId)); }
    catch { setRows([]); }
    setLoading(false);
  };

  useEffect(() => { load(active); }, [active]);

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Determine columns
  let cols = [];
  const preferred = EXPLORER_COLUMNS[active];
  if (rows.length > 0) {
    const allKeys = Object.keys(rows[0]);
    if (preferred) {
      cols = preferred.filter(c => allKeys.includes(c));
      const extras = allKeys.filter(k => !cols.includes(k) && k !== "_id" && !ID_LIKE.test(k));
      cols = [...cols, ...extras].slice(0, 8);
    } else {
      cols = allKeys.filter(k => k !== "_id").slice(0, 8);
    }
  } else if (preferred) {
    // Empty collection: still show preferred headers
    cols = preferred.slice(0, 8);
  }

  // Specialized views
  if (active === "settings") {
    return <SettingsExplorer rows={rows} loading={loading} active={active} setActive={setActive} />;
  }
  if (active === "roles") {
    return <RolesExplorer rows={rows} loading={loading} active={active} setActive={setActive} />;
  }

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Collection Explorer</h2>
        <p className="dbm-view-subtitle">Browse and search all documents across every collection</p>
      </div>
      <div className="dbm-explorer-layout">
        <div className="dbm-explorer-sidebar">
          <div className="dbm-explorer-sidebar-title">Collections</div>
          {ALL_COLLECTIONS.map(col => (
            <button key={col.id} className={`dbm-col-btn${active === col.id ? " dbm-col-btn--active" : ""}`}
              onClick={() => setActive(col.id)}>
              <span>{col.icon}</span>
              <span className="dbm-col-btn-label">{col.label}</span>
            </button>
          ))}
        </div>
        <div className="dbm-explorer-main">
          {loading || !lookupsLoaded ? <div className="dbm-loading"><div className="loading-spinner" /></div> : (
            <>
              <div className="dbm-explorer-toolbar">
                <input className="dbm-search" placeholder={`Search ${active}…`}
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                <span className="dbm-explorer-count">{filtered.length} records</span>
              </div>
              {rows.length === 0 ? (
                <div className="dbm-empty-state">
                  <span className="dbm-empty-icon">📭</span>
                  <p>This collection is empty.</p>
                  {cols.length > 0 && (
                    <p className="dbm-view-subtitle">Schema fields: {cols.map(humanField).join(", ")}</p>
                  )}
                </div>
              ) : filtered.length === 0 ? (
                <div className="dbm-empty-state"><span className="dbm-empty-icon">🔍</span><p>No matches for your search.</p></div>
              ) : (
                <>
                  <div className="dbm-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>{cols.map(c => (
                          <th key={c}>{humanField(c)}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row, i) => (
                          <tr key={i}>
                            {cols.map(c => (
                              <td key={c} className="dbm-td-truncate" title={typeof row[c] === "object" ? JSON.stringify(row[c]) : String(row[c] ?? "")}>
                                {renderCellValue(row[c], c, lookups)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {pages > 1 && (
                    <div className="pagination">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                      <span className="pagination-info">Page {page} of {pages}</span>
                      <button disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Settings — flatten and display key/value pairs */
function SettingsExplorer({ rows, loading, active, setActive }) {
  const entries = [];
  rows.forEach(row => {
    Object.entries(row).forEach(([k, v]) => {
      if (k === "_id") return;
      entries.push({ docId: row._id, key: k, value: v });
    });
  });

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">System Settings</h2>
        <p className="dbm-view-subtitle">All configuration values stored in the settings collection</p>
      </div>
      <div className="dbm-explorer-layout">
        <div className="dbm-explorer-sidebar">
          <div className="dbm-explorer-sidebar-title">Collections</div>
          {ALL_COLLECTIONS.map(col => (
            <button key={col.id} className={`dbm-col-btn${active === col.id ? " dbm-col-btn--active" : ""}`}
              onClick={() => setActive(col.id)}>
              <span>{col.icon}</span>
              <span className="dbm-col-btn-label">{col.label}</span>
            </button>
          ))}
        </div>
        <div className="dbm-explorer-main">
          {loading ? <div className="dbm-loading"><div className="loading-spinner" /></div> :
           entries.length === 0 ? (
            <div className="dbm-empty-state">
              <span className="dbm-empty-icon">⚙️</span>
              <p>No settings stored yet.</p>
            </div>
          ) : (
            <div className="dbm-settings-grid">
              {entries.map((e, i) => (
                <div key={i} className="dbm-setting-row">
                  <div className="dbm-setting-key">
                    <span className="dbm-setting-icon">⚙️</span>
                    <span className="dbm-setting-name">{humanField(e.key)}</span>
                  </div>
                  <div className="dbm-setting-value">{renderCellValue(e.value, e.key, {})}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Roles — display each role with its permissions */
function RolesExplorer({ rows, loading, active, setActive }) {
  const allPerms = new Set();
  rows.forEach(r => {
    const perms = r.permissions || r.perms || [];
    if (Array.isArray(perms)) perms.forEach(p => allPerms.add(p));
    else if (typeof perms === "object") Object.keys(perms).forEach(p => allPerms.add(p));
  });
  const permList = [...allPerms].sort();

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Roles & Permissions</h2>
        <p className="dbm-view-subtitle">Each role and its assigned permissions</p>
      </div>
      <div className="dbm-explorer-layout">
        <div className="dbm-explorer-sidebar">
          <div className="dbm-explorer-sidebar-title">Collections</div>
          {ALL_COLLECTIONS.map(col => (
            <button key={col.id} className={`dbm-col-btn${active === col.id ? " dbm-col-btn--active" : ""}`}
              onClick={() => setActive(col.id)}>
              <span>{col.icon}</span>
              <span className="dbm-col-btn-label">{col.label}</span>
            </button>
          ))}
        </div>
        <div className="dbm-explorer-main">
          {loading ? <div className="dbm-loading"><div className="loading-spinner" /></div> :
           rows.length === 0 ? (
            <div className="dbm-empty-state">
              <span className="dbm-empty-icon">🛡️</span>
              <p>No roles defined yet.</p>
            </div>
          ) : (
            <div className="dbm-roles-grid">
              {rows.map(role => {
                const perms = Array.isArray(role.permissions) ? role.permissions
                  : (role.permissions && typeof role.permissions === "object" ? Object.keys(role.permissions).filter(k => role.permissions[k]) : []);
                const has = (p) => perms.includes(p);
                return (
                  <div key={role._id} className="dbm-role-card">
                    <div className="dbm-role-header">
                      <span className="dbm-role-icon">🛡️</span>
                      <div>
                        <div className="dbm-role-name">{role.name || role._id}</div>
                        {role.description && <div className="dbm-role-desc">{role.description}</div>}
                      </div>
                    </div>
                    <div className="dbm-role-perms">
                      {(permList.length > 0 ? permList : perms).map(p => (
                        <label key={p} className="dbm-role-perm-row">
                          <input type="checkbox" checked={has(p)} readOnly />
                          <span>{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: USERS
═══════════════════════════════════════════════════════════ */
function UsersView() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [userData, setUserData]     = useState({});
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try { setUsers(await DB_ADAPTER.fetchCollection("users")); }
      catch { setUsers([]); }
      setLoading(false);
    })();
  }, []);

  const loadUserData = async (user) => {
    setSelected(user); setUserLoading(true);
    const uid = user.id;
    const results = {};
    for (const col of ALL_COLLECTIONS.filter(c => c.userField)) {
      try {
        results[col.id] = await countCollectionByField(col.id, col.userField, uid);
      } catch { results[col.id] = 0; }
    }
    setUserData(results);
    setUserLoading(false);
  };

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.username}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">User Data Manager</h2>
        <p className="dbm-view-subtitle">View all data records linked to any user</p>
      </div>
      <div className="dbm-users-layout">
        <div className="dbm-users-list">
          <input className="dbm-search" placeholder="Search users…" value={search}
            onChange={e => setSearch(e.target.value)} />
          {loading ? <div className="dbm-loading"><div className="loading-spinner" /></div>
            : filtered.map(u => (
              <button key={u._id || u._docId}
                className={`dbm-user-row${selected?._id === u._id ? " dbm-user-row--active" : ""}`}
                onClick={() => loadUserData(u)}>
                <div className="dbm-user-avatar">{(u.firstName?.[0] || u.email?.[0] || "?").toUpperCase()}</div>
                <div className="dbm-user-info">
                  <div className="dbm-user-name">{u.firstName} {u.lastName}</div>
                  <div className="dbm-user-email">{u.email}</div>
                </div>
              </button>
            ))}
        </div>
        <div className="dbm-user-detail">
          {!selected ? (
            <div className="dbm-empty-state"><span className="dbm-empty-icon">👤</span><p>Select a user to view their data.</p></div>
          ) : (
            <>
              <div className="dbm-user-detail-header">
                <div className="dbm-user-avatar dbm-user-avatar--lg">{(selected.firstName?.[0] || "?").toUpperCase()}</div>
                <div>
                  <div className="dbm-user-detail-name">{selected.firstName} {selected.lastName}</div>
                  <div className="dbm-user-email">{selected.email}</div>
                  <div className="dbm-user-fields">
                    {selected.role && <span className="chip chip-blue">{selected.role}</span>}
                    {selected.lastLogin && <span className="chip">Last login: {fmtDateTime(selected.lastLogin)}</span>}
                  </div>
                </div>
              </div>
              {userLoading ? <div className="dbm-loading"><div className="loading-spinner" /></div> : (
                <div className="dbm-user-data-grid">
                  {ALL_COLLECTIONS.filter(c => c.userField).map(col => {
                    const count = userData[col.id] ?? 0;
                    return (
                      <div key={col.id} className={`dbm-user-data-card${count > 0 ? " dbm-user-data-card--active" : ""}`}>
                        <span className="dbm-user-data-icon">{col.icon}</span>
                        <div className="dbm-user-data-label">{col.label}</div>
                        <strong className="dbm-user-data-count">{count}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: DELETE
═══════════════════════════════════════════════════════════ */
function DeleteView({ showToast }) {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectionMode, setSelectionMode] = useState("single");
  const [categories, setCategories]     = useState({});
  const [confirm, setConfirm]           = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [progress, setProgress]         = useState("");
  const [counting, setCounting]         = useState(false);

  useEffect(() => {
    (async () => {
      try { setUsers(await DB_ADAPTER.fetchCollection("users")); }
      catch { setUsers([]); }
      setLoading(false);
    })();
  }, []);

  const toggleUser = (u) => {
    if (selectionMode === "single") setSelectedUsers([u]);
    else setSelectedUsers(prev => prev.find(p => p._id === u._id) ? prev.filter(p => p._id !== u._id) : [...prev, u]);
  };

  const selectedCols = DATA_CATEGORIES.filter(c => categories[c.id]).flatMap(c => c.collections);

  const preCountAndConfirm = async (type) => {
    setCounting(true);
    try {
      let total = 0;
      const perCollection = {};

      if (type === "complete") {
        for (const user of selectedUsers) {
          perCollection.users = (perCollection.users || 0) + 1;
          total += 1;
          for (const col of ALL_COLLECTIONS.filter(c => c.userField)) {
            try {
              const n = await countCollectionByField(col.id, col.userField, user.id);
              perCollection[col.id] = (perCollection[col.id] || 0) + n;
              total += n;
            } catch { /* ignore */ }
          }
        }
      } else {
        for (const user of selectedUsers) {
          for (const colId of selectedCols) {
            if (colId === "users") {
              perCollection.users = (perCollection.users || 0) + 1;
              total += 1;
            } else {
              const colInfo = ALL_COLLECTIONS.find(c => c.id === colId);
              const field = colInfo?.userField || "userId";
              try {
                const n = await countCollectionByField(colId, field, user.id);
                perCollection[colId] = (perCollection[colId] || 0) + n;
                total += n;
              } catch { /* ignore */ }
            }
          }
        }
      }

      setConfirm({ type, totalAffected: total, perCollection });
    } catch (err) {
      showToast("error", "Pre-count failed: " + err.message);
    }
    setCounting(false);
  };

  const executeDelete = async () => {
    setDeleting(true); setProgress("Gathering documents…");
    try {
      const ops = [];
      for (const user of selectedUsers) {
        const uid = user.id;
        for (const colId of selectedCols) {
          if (colId === "users") {
            ops.push(getRecordRef("users", user._id));
          } else {
            const colInfo = ALL_COLLECTIONS.find(c => c.id === colId);
            const field = colInfo?.userField || "userId";
            await removeRecordsByField(colId, field, uid);
          }
        }
      }
      // delete user doc refs collected
      if (ops.length > 0) {
        setProgress(`Deleting ${ops.length} user document(s)…`);
        const batch = getWriteBatch();
        ops.forEach(ref => batch.delete(ref));
        await batch.commit();
      }
      showToast("success", `Deleted records for ${selectedUsers.length} user(s).`);
      setConfirm(null); setSelectedUsers([]); setCategories({});
    } catch (err) { showToast("error", "Delete failed: " + err.message); }
    setDeleting(false); setProgress("");
  };

  const deleteUserCompletely = async () => {
    setDeleting(true); setProgress("Gathering all user records…");
    try {
      const ops = [];
      for (const user of selectedUsers) {
        const uid = user.id;
        ops.push(getRecordRef("users", user._id));
        for (const col of ALL_COLLECTIONS.filter(c => c.userField)) {
          await removeRecordsByField(col.id, col.userField, uid);
        }
      }
      if (ops.length > 0) {
        setProgress(`Deleting ${ops.length} user document(s)…`);
        const batch = getWriteBatch();
        ops.forEach(ref => batch.delete(ref));
        await batch.commit();
      }
      setUsers(prev => prev.filter(u => !selectedUsers.find(su => su._id === u._id)));
      setSelectedUsers([]);
      showToast("success", `Completely deleted ${selectedUsers.length} user(s) — ${ops.length} records.`);
      setConfirm(null);
    } catch (err) { showToast("error", "Delete failed: " + err.message); }
    setDeleting(false); setProgress("");
  };

  const affectedLines = confirm
    ? [
        `👥 Users selected: ${selectedUsers.length}`,
        ...Object.entries(confirm.perCollection || {})
          .filter(([_, n]) => n > 0)
          .map(([col, n]) => `📁 ${col}: ${n.toLocaleString()} record${n === 1 ? "" : "s"}`),
      ]
    : [];

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Delete Manager</h2>
        <p className="dbm-view-subtitle">Granular, category-based deletion with affected-record pre-count</p>
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><span className="dbm-step-num">1</span><h3>Select Users</h3></div>
        <div className="dbm-mode-tabs">
          {[["single","Single User"],["multiple","Multiple Users"],["all","All Users"]].map(([m,l]) => (
            <button key={m} className={`dbm-mode-tab${selectionMode === m ? " dbm-mode-tab--active" : ""}`}
              onClick={() => { setSelectionMode(m); setSelectedUsers(m === "all" ? users : []); }}>
              {l}
            </button>
          ))}
        </div>
        {selectionMode !== "all" && (
          <div className="dbm-delete-user-list">
            {loading ? <div className="dbm-loading"><div className="loading-spinner" /></div>
              : users.map(u => (
                <label key={u._id} className="dbm-user-check-row">
                  <input type={selectionMode === "single" ? "radio" : "checkbox"} name="del-user"
                    checked={!!selectedUsers.find(su => su._id === u._id)} onChange={() => toggleUser(u)} />
                  <div className="dbm-user-avatar dbm-user-avatar--sm">{(u.firstName?.[0] || "?").toUpperCase()}</div>
                  <div>
                    <div className="dbm-user-name">{u.firstName} {u.lastName}</div>
                    <div className="dbm-user-email">{u.email}</div>
                  </div>
                </label>
              ))}
          </div>
        )}
        {selectionMode === "all" && <div className="dbm-info-pill">⚠️ All {users.length} users selected.</div>}
        {selectedUsers.length > 0 && <div className="dbm-selected-pill">✓ {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected</div>}
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><span className="dbm-step-num">2</span><h3>Select Data Categories</h3></div>
        <div className="dbm-category-grid">
          {DATA_CATEGORIES.map(cat => (
            <label key={cat.id} className={`dbm-category-card${categories[cat.id] ? " dbm-category-card--selected" : ""}`}>
              <input type="checkbox" checked={!!categories[cat.id]}
                onChange={() => setCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))} />
              <span className="dbm-category-icon">{cat.icon}</span>
              <div>
                <div className="dbm-category-label">{cat.label}</div>
                <div className="dbm-category-cols">{cat.collections.join(", ")}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><span className="dbm-step-num">3</span><h3>Execute Action</h3></div>
        <div className="dbm-action-row">
          <button className="btn btn-danger"
            disabled={selectedUsers.length === 0 || selectedCols.length === 0 || deleting || counting}
            onClick={() => preCountAndConfirm("selective")}>
            🗑️ {counting ? "Counting…" : "Delete Selected Data"}
          </button>
          <button className="btn btn-danger dbm-nuke-btn"
            disabled={selectedUsers.length === 0 || deleting || counting}
            onClick={() => preCountAndConfirm("complete")}>
            ☠️ {counting ? "Counting…" : "Delete Users Completely"}
          </button>
        </div>
        {deleting && (
          <div className="dbm-progress-bar">
            <div className="loading-spinner" />
            <span>{progress || "Processing… do not close this tab."}</span>
          </div>
        )}
      </div>

      <ConfirmModal open={!!confirm} onClose={() => !deleting && setConfirm(null)}
        onConfirm={confirm?.type === "complete" ? deleteUserCompletely : executeDelete}
        title={confirm?.type === "complete" ? "Complete User Deletion" : "Delete Selected Data"}
        message={confirm?.type === "complete"
          ? `Permanently delete ALL data for ${selectedUsers.length} user(s) across every collection?`
          : `Delete selected data categories for ${selectedUsers.length} user(s)?`}
        danger
        totalAffected={confirm?.totalAffected}
        affectedInfo={affectedLines}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: EXPORT
═══════════════════════════════════════════════════════════ */
const EXPORT_FORMATS = ["JSON", "CSV", "SQL", ".udb v2 (Universal DB Package)"];

function ExportView({ showToast }) {
  const [mode, setMode]           = useState("collection");
  const [selCols, setSelCols]     = useState([ALL_COLLECTIONS[0].id]);
  const [format, setFormat]       = useState("JSON");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0, col: "" });
  const [successPopup, setSuccessPopup] = useState(null);

  const toggleCol = (id) => {
    setSelCols(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(c => c !== id) : prev) : [...prev, id]);
  };

  const doExport = async () => {
    setExporting(true); setSuccessPopup(null);
    const startTime = performance.now();
    const colsToExport = mode === "full" ? ALL_COLLECTIONS.map(c => c.id)
      : mode === "multi" ? selCols : [selCols[0]];

    const reportLines = [];
    const ts = Date.now();

    try {
      if (format.includes(".udb")) {
        const dataMap = {};
        for (let i = 0; i < colsToExport.length; i++) {
          const colId = colsToExport[i];
          setProgress({ done: i, total: colsToExport.length, col: colId });
          dataMap[colId] = await DB_ADAPTER.fetchCollection(colId);
          reportLines.push(`✓ ${colId}: ${dataMap[colId].length} records${dataMap[colId].length === 0 ? " (empty — schema only)" : ""}`);
        }

        setProgress({ done: colsToExport.length, total: colsToExport.length, col: "Building package…" });
        const pkg = await buildUDBPackage(colsToExport, dataMap);

        const totalRecords = Object.values(dataMap).reduce((s, r) => s + r.length, 0);
        const fname = `sravya-backup-${fmtDateOnly(ts)}.udb`;
        const serialized = serializeUDB(pkg);
        downloadBlob(serialized, fname, "application/json");

        reportLines.push(`\n📦 Package: ${fname}`);
        reportLines.push(`📊 Total records: ${totalRecords.toLocaleString()}`);
        reportLines.push(`📁 Collections: ${colsToExport.length}`);
        reportLines.push(`💾 Size: ${fmtBytes(new TextEncoder().encode(serialized).length)}`);
        reportLines.push(`🔐 SHA-256 checksums embedded`);
        reportLines.push(`🧬 ${UNIVERSAL_TYPES.length} universal types embedded`);
        reportLines.push(`⚙️ UDB Engine v${UDB_ENGINE_VERSION} · Format v${UDB_FORMAT_VERSION}`);
      } else {
        for (let i = 0; i < colsToExport.length; i++) {
          const colId = colsToExport[i];
          setProgress({ done: i, total: colsToExport.length, col: colId });
          const rows = await DB_ADAPTER.fetchCollection(colId);
          let content, ext;
          if (format === "JSON") { content = JSON.stringify(rows, null, 2); ext = ".json"; }
          else if (format === "CSV") { content = toCSV(rows); ext = ".csv"; }
          else {
            const schema = inferCollectionSchema(colId, rows);
            content = toSQL(colId, rows, schema, "mysql"); ext = ".sql";
          }
          const fname = `${colId}-${fmtDateOnly(ts)}${ext}`;
          downloadBlob(content, fname, "text/plain");
          reportLines.push(`✓ ${colId}: ${rows.length} records → ${fname}`);
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      reportLines.push(`\n⏱️ Duration: ${durationMs} ms`);

      setSuccessPopup({ title: "Export Complete", lines: reportLines, ts });
      showToast("success", `Exported ${colsToExport.length} table(s) in ${durationMs} ms.`);
    } catch (err) {
      showToast("error", "Export failed: " + err.message);
    }
    setExporting(false); setProgress({ done: 0, total: 0, col: "" });
  };

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Export Data</h2>
        <p className="dbm-view-subtitle">Export as JSON, CSV, SQL, or the Universal Database Package (.udb v2.3)</p>
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><StepBadge n="1" active /><h3>Select Collections</h3></div>
        <div className="dbm-mode-tabs">
          {[["collection","Single"],["multi","Multiple"],["full","Full Database"]].map(([m,l]) => (
            <button key={m} className={`dbm-mode-tab${mode === m ? " dbm-mode-tab--active" : ""}`}
              onClick={() => setMode(m)}>{l}</button>
          ))}
        </div>
        {mode !== "full" && (
          <div className="udb-col-picker">
            {ALL_COLLECTIONS.map(col => {
              const active = selCols.includes(col.id);
              return (
                <label key={col.id} className={`udb-col-chip${active ? " udb-col-chip--active" : ""}`}>
                  <input type={mode === "collection" ? "radio" : "checkbox"}
                    name="export-col" checked={active}
                    onChange={() => mode === "collection" ? setSelCols([col.id]) : toggleCol(col.id)} />
                  {col.icon} {col.label}
                </label>
              );
            })}
          </div>
        )}
        {mode === "full" && (
          <div className="dbm-info-pill">📦 All {ALL_COLLECTIONS.length} collections will be included (empty collections export schema only).</div>
        )}
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><StepBadge n="2" active /><h3>Export Format</h3></div>
        <div className="udb-format-grid">
          {EXPORT_FORMATS.map(f => {
            const isUdb = f.includes(".udb");
            return (
              <label key={f} className={`udb-format-card${format === f ? " udb-format-card--active" : ""}${isUdb ? " udb-format-card--special" : ""}`}>
                <input type="radio" name="fmt" value={f} checked={format === f} onChange={() => setFormat(f)} />
                <span className="udb-format-icon">{f === "JSON" ? "📄" : f === "CSV" ? "📊" : f === "SQL" ? "🗃️" : "📦"}</span>
                <span className="udb-format-name">{f.includes(".") ? f.split(" ")[0] : f}</span>
                {isUdb && <span className="udb-badge">Universal v2</span>}
              </label>
            );
          })}
        </div>
      </div>

      <div className="dbm-step-card">
        <div className="dbm-step-header"><StepBadge n="3" active /><h3>Generate Export</h3></div>
        {exporting && progress.total > 0 && (
          <ProgressBar value={progress.done} max={progress.total}
            label={`Exporting ${progress.col}…`} color="blue" />
        )}
        <button className="btn btn-primary udb-export-btn" onClick={doExport} disabled={exporting}>
          {exporting ? "⏳ Exporting…" : "⬇️ Download Export"}
        </button>
      </div>

      <SuccessPopup
        open={!!successPopup}
        onClose={() => setSuccessPopup(null)}
        title={successPopup?.title}
        lines={successPopup?.lines || []}
        ts={successPopup?.ts}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: IMPORT — handles empty collections gracefully
═══════════════════════════════════════════════════════════ */
function ImportView({ showToast }) {
  const [step, setStep]           = useState(1);
  const [fileInfo, setFileInfo]   = useState(null);
  const [parsed, setParsed]       = useState(null);
  const [validation, setValidation] = useState(null);
  const [targetCol, setTargetCol] = useState(ALL_COLLECTIONS[0].id);
  const [conflictMode, setConflictMode] = useState("skip");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0, col: "" });
  const [validating, setValidating] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);
  const fileRef = useRef();

  const reset = () => {
    setStep(1); setFileInfo(null); setParsed(null); setValidation(null);
    setProgress({ done: 0, total: 0, col: "" });
    if (fileRef.current) { fileRef.current.value = ""; fileRef.current._data = null; }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileInfo({ name: file.name, size: file.size, type: file.type });
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      try {
        let result = null;
        if (file.name.endsWith(".udb") || file.name.endsWith(".dba")) {
          const pkg = parseUDB(text);
          result = {
            type: file.name.endsWith(".dba") ? "dba" : "udb",
            collections: Object.keys(pkg.data),
            data: pkg.data,
            manifest: pkg.manifest, schema: pkg.schema,
            relationships: pkg.relationships, permissions: pkg.permissions,
            validation: pkg.validation, checksums: pkg.checksums, migration: pkg.migration,
            _rawPkg: pkg,
          };
        } else if (file.name.endsWith(".json")) {
          const raw = JSON.parse(text);
          if (Array.isArray(raw)) result = { type: "json_array", collections: [targetCol], data: { [targetCol]: raw } };
          else if (typeof raw === "object") {
            const keys = Object.keys(raw);
            const isMulti = keys.some(k => Array.isArray(raw[k]));
            if (isMulti) result = { type: "json_multi", collections: keys, data: raw };
            else result = { type: "json_array", collections: [targetCol], data: { [targetCol]: [raw] } };
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = text.trim().split("\n");
          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
          const rows = lines.slice(1).map(line => {
            const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
            return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
          });
          result = { type: "csv", collections: [targetCol], data: { [targetCol]: rows } };
        } else if (file.name.endsWith(".sql")) {
          const rows = [];
          const re = /INSERT INTO\s+`?(\w+)`?\s+VALUES\s*\(([^)]+)\)/gi;
          let match;
          while ((match = re.exec(text)) !== null) {
            const vals = match[2].split(",").map(v => v.trim().replace(/^'|'$/g, ""));
            rows.push({ _raw: vals.join(", ") });
          }
          result = { type: "sql", collections: [targetCol], data: { [targetCol]: rows } };
        }

        if (!result) { showToast("error", "Could not parse file."); return; }
        fileRef.current._data = result;
        setParsed(result);
        setStep(2);
      } catch (err) { showToast("error", "Parse failed: " + err.message); }
    };
    reader.readAsText(file);
  };

  const runValidation = async () => {
    if (!parsed) return;
    setValidating(true);
    let result;
    if (parsed._rawPkg) result = await validateUDBPackage(parsed._rawPkg);
    else {
      const warnings = [], errors = [];
      for (const colId of parsed.collections) {
        const rows = parsed.data[colId] || [];
        if (rows.length === 0) warnings.push(`ℹ️ Collection "${colId}" has 0 records — will be skipped.`);
        const ids = rows.map(r => r._id).filter(Boolean);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (dupes.length > 0) warnings.push(`⚠️ ${colId}: ${dupes.length} duplicate _id(s).`);
      }
      result = { ok: errors.length === 0, warnings, errors };
    }
    setValidating(false);
    setValidation(result);
    setStep(3);
  };

  const doImport = async () => {
    if (!parsed) return;
    setImporting(true); setStep(4);
    const startTime = performance.now();
    const reportLines = [];
    const perCollection = {};
    let totalImported = 0, failedRecords = 0, skippedCollections = 0;

    try {
      for (let ci = 0; ci < parsed.collections.length; ci++) {
        const colId = parsed.collections[ci];
        const rows  = parsed.data[colId] || [];

        // Empty collections: skip data import (schema is implicit in Firestore)
        if (rows.length === 0) {
          perCollection[colId] = { imported: 0, failed: 0, skipped: true };
          reportLines.push(`⟳ ${colId}: empty — skipped (schema only)`);
          skippedCollections++;
          continue;
        }

        setProgress({ done: ci, total: parsed.collections.length, col: colId });
        let written = 0, failed = 0;

        try {
          const result = await writeCollectionMerge(colId, rows, conflictMode, (done, total) => {
            setProgress({ done: ci, total: parsed.collections.length, col: colId });
          });
          written = result.written;
          failed  = result.failed;
        } catch { failed = rows.length; }

        totalImported += written;
        failedRecords += failed;
        perCollection[colId] = { imported: written, failed, skipped: false };
        reportLines.push(`✓ ${colId}: ${written} imported${failed ? `, ${failed} failed` : ""}`);
      }

      const durationMs = Math.round(performance.now() - startTime);
      reportLines.push(`\n📊 Total imported: ${totalImported.toLocaleString()} records`);
      reportLines.push(`⟳ Empty collections skipped: ${skippedCollections}`);
      reportLines.push(`❌ Failed: ${failedRecords}`);
      reportLines.push(`📁 Collections processed: ${parsed.collections.length}`);
      reportLines.push(`🔄 Conflict mode: ${conflictMode}`);
      reportLines.push(`⏱️ Duration: ${durationMs} ms`);

      setSuccessPopup({ title: failedRecords > 0 ? "Import Completed with Errors" : "Import Successful", lines: reportLines, ts: Date.now() });
      showToast(failedRecords > 0 ? "error" : "success",
        `Imported ${totalImported} records${failedRecords ? ` (${failedRecords} failed)` : ""} in ${durationMs} ms.`);
      setStep(5);
    } catch (err) {
      showToast("error", "Import failed: " + err.message);
      setStep(3);
    }
    setImporting(false);
    setProgress({ done: 0, total: 0, col: "" });
  };

  const totalRecords = parsed
    ? Object.values(parsed.data).reduce((s, rows) => s + (Array.isArray(rows) ? rows.length : 0), 0)
    : 0;
  const emptyCount = parsed
    ? Object.values(parsed.data).filter(rows => Array.isArray(rows) && rows.length === 0).length
    : 0;

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Universal Data Import</h2>
        <p className="dbm-view-subtitle">Import JSON, CSV, SQL, or .udb files with full schema validation</p>
      </div>

      <div className="udb-stepper">
        {["Upload","Validate","Preview","Import","Done"].map((s, i) => (
          <div key={s} className={`udb-stepper-step${step > i ? " udb-stepper-step--done" : ""}${step === i + 1 ? " udb-stepper-step--active" : ""}`}>
            <StepBadge n={i + 1} active={step === i + 1} done={step > i + 1} />
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="udb-panel">
        {step === 1 && (
          <div className="dbm-step-card">
            <div className="dbm-step-header"><StepBadge n="1" active /><h3>Upload File</h3></div>
            <div className="udb-upload-zone" onClick={() => fileRef.current?.click()}>
              <span className="udb-upload-icon">📂</span>
              <p className="udb-upload-title">Click to select a file</p>
              <p className="udb-upload-formats">Supported: .json .csv .sql .udb .dba</p>
              <input ref={fileRef} type="file" accept=".json,.csv,.sql,.udb,.dba" style={{ display: "none" }} onChange={handleFile} />
            </div>
            {(!parsed?.type || ["json_array","csv","sql"].includes(parsed?.type)) && (
              <div className="form-group">
                <label>Default Target Collection</label>
                <select value={targetCol} onChange={e => setTargetCol(e.target.value)}>
                  {ALL_COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {step === 2 && parsed && (
          <div className="dbm-step-card">
            <div className="dbm-step-header"><StepBadge n="2" active /><h3>Validate Package</h3></div>
            <div className="udb-file-meta">
              <div className="udb-file-meta-row"><span>📄 File</span><strong>{fileInfo?.name}</strong></div>
              <div className="udb-file-meta-row"><span>📦 Format</span><strong>{parsed.type.toUpperCase()}</strong></div>
              <div className="udb-file-meta-row"><span>💾 Size</span><strong>{fmtBytes(fileInfo?.size)}</strong></div>
              <div className="udb-file-meta-row"><span>📁 Collections</span><strong>{parsed.collections.length}</strong></div>
              <div className="udb-file-meta-row"><span>📄 Total Records</span><strong>{totalRecords}</strong></div>
              {emptyCount > 0 && (
                <div className="udb-file-meta-row"><span>⟳ Empty Collections</span><strong>{emptyCount} (schema only)</strong></div>
              )}
              {parsed.manifest && (
                <>
                  <div className="udb-file-meta-row"><span>🏷️ Application</span><strong>{parsed.manifest.application}</strong></div>
                  <div className="udb-file-meta-row"><span>📅 Exported</span><strong>{fmtDateTime(parsed.manifest.exportTimestamp)}</strong></div>
                  {parsed.checksums?.algorithm && (
                    <div className="udb-file-meta-row"><span>🔐 Checksum</span><strong>{parsed.checksums.algorithm}</strong></div>
                  )}
                </>
              )}
            </div>
            <button className="btn btn-primary" onClick={runValidation} disabled={validating}>
              {validating ? "⏳ Verifying…" : "🔍 Run Full Validation"}
            </button>
          </div>
        )}

        {step === 3 && parsed && validation && (
          <div className="dbm-step-card">
            <div className="dbm-step-header"><StepBadge n="3" active /><h3>Preview & Confirm</h3></div>
            {validation.errors.length > 0 && (
              <div className="udb-validation-box udb-validation-box--error">
                {validation.errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="udb-validation-box udb-validation-box--warning">
                {validation.warnings.map((w, i) => <div key={i}>{w}</div>)}
              </div>
            )}
            {validation.ok && validation.warnings.length === 0 && (
              <div className="udb-validation-box udb-validation-box--ok">✅ Package validated — no issues found.</div>
            )}

            <div className="form-group">
              <label>Conflict Resolution</label>
              <div className="udb-conflict-grid">
                {[["skip","Skip Existing","Don't overwrite existing records"],
                  ["replace","Replace Existing","Overwrite records with matching _id"],
                  ["merge","Merge Records","Deep-merge fields into existing records"]].map(([v,l,d]) => (
                  <label key={v} className={`udb-conflict-card${conflictMode === v ? " udb-conflict-card--active" : ""}`}>
                    <input type="radio" name="conflict" value={v} checked={conflictMode === v} onChange={() => setConflictMode(v)} />
                    <strong>{l}</strong>
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="dbm-action-row">
              <button className="btn btn-secondary" onClick={reset}>✕ Cancel</button>
              <button className="btn btn-primary" disabled={!validation.ok} onClick={doImport}>
                📥 Import {totalRecords.toLocaleString()} Records
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="dbm-step-card">
            <div className="dbm-step-header"><StepBadge n="4" active /><h3>Importing Data…</h3></div>
            <ProgressBar value={progress.done} max={progress.total || 1}
              label={progress.col ? `Importing ${progress.col}…` : "Preparing…"} color="green" />
            <div className="dbm-info-pill">⚠️ Do not close this tab during import.</div>
          </div>
        )}

        {step === 5 && (
          <div className="dbm-step-card">
            <div className="dbm-step-header"><StepBadge n="5" done /><h3>Import Complete</h3></div>
            <button className="btn btn-secondary" onClick={reset}>↩ Import Another File</button>
          </div>
        )}
      </div>

      <SuccessPopup
        open={!!successPopup}
        onClose={() => setSuccessPopup(null)}
        title={successPopup?.title}
        lines={successPopup?.lines || []}
        ts={successPopup?.ts}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: BACKUP & RESTORE
═══════════════════════════════════════════════════════════ */
const BACKUP_KEY    = "dbm_backups_v2";
const SCHEDULE_KEY  = "dbm_schedule";
const LAST_AUTO_KEY = "dbm_last_auto";
const RETENTION_KEY = "dbm_retention";
const DEFAULT_RETENTION = 5;

function BackupView({ showToast }) {
  const [backups, setBackups]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]"); } catch { return []; }
  });
  const [creating, setCreating]   = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [schedule, setSchedule]   = useState(() => localStorage.getItem(SCHEDULE_KEY) || "none");
  const [progress, setProgress]   = useState({ done: 0, total: 0, col: "" });
  const [activeTab, setActiveTab] = useState("backups");
  const [retentionLimit, setRetentionLimit] = useState(() =>
    parseInt(localStorage.getItem(RETENTION_KEY) || String(DEFAULT_RETENTION), 10)
  );
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  useEffect(() => {
    const last  = parseInt(localStorage.getItem(LAST_AUTO_KEY) || "0", 10);
    const now   = Date.now();
    const sched = localStorage.getItem(SCHEDULE_KEY) || "none";
    const intervals = { daily: 86400000, weekly: 604800000, monthly: 2592000000 };
    if (intervals[sched] && now - last > intervals[sched]) autoBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyRetention = (list, limit) => {
    const pinned   = list.filter(b => b.pinned);
    const unpinned = list.filter(b => !b.pinned);
    const kept = unpinned.slice(0, limit);
    return [...pinned, ...kept].sort((a, b) => b.id - a.id);
  };

  const saveBackups = (list, limit = retentionLimit) => {
    const pruned = applyRetention(list, limit);
    setBackups(pruned);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(pruned));
    return pruned;
  };

  const buildSnapshot = async (onProgress) => {
    const snapshot = {};
    for (let i = 0; i < ALL_COLLECTIONS.length; i++) {
      const col = ALL_COLLECTIONS[i];
      onProgress?.({ done: i, total: ALL_COLLECTIONS.length, col: col.id });
      snapshot[col.id] = await DB_ADAPTER.fetchCollection(col.id);
    }
    return snapshot;
  };

  const autoBackup = async () => {
    try {
      const snapshot = await buildSnapshot();
      const ts = Date.now();
      const docCount = Object.values(snapshot).reduce((s, r) => s + r.length, 0);
      const b = {
        id: ts, date: fmtDateTime(ts), docCount, type: "auto",
        size: fmtBytes(new TextEncoder().encode(JSON.stringify(snapshot)).length),
        collections: ALL_COLLECTIONS.length, pinned: false, data: snapshot,
      };
      const stored = JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
      const limit  = parseInt(localStorage.getItem(RETENTION_KEY) || String(DEFAULT_RETENTION), 10);
      saveBackups([b, ...stored], limit);
      localStorage.setItem(LAST_AUTO_KEY, String(ts));
    } catch { /* silent */ }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      const snapshot = await buildSnapshot((p) => setProgress(p));
      const ts = Date.now();
      const docCount = Object.values(snapshot).reduce((s, r) => s + r.length, 0);
      const b = {
        id: ts, date: fmtDateTime(ts), docCount, type: "manual",
        size: fmtBytes(new TextEncoder().encode(JSON.stringify(snapshot)).length),
        collections: ALL_COLLECTIONS.length, pinned: false, data: snapshot,
      };
      saveBackups([b, ...backups]);
      setSuccessPopup({
        title: "Backup Created",
        lines: [
          `📅 Date: ${b.date}`,
          `📊 Documents: ${docCount.toLocaleString()}`,
          `💾 Size: ${b.size}`,
          `📁 Collections: ${b.collections}`,
        ],
        ts,
      });
      showToast("success", `Backup created — ${docCount} docs, ${b.size}.`);
    } catch (err) { showToast("error", "Backup failed: " + err.message); }
    setCreating(false); setProgress({ done: 0, total: 0, col: "" });
  };

  const restoreBackup = async (b) => {
    setRestoring(true);
    const reportLines = [];
    try {
      const safeSnap = await buildSnapshot();
      const safeTs = Date.now();
      const safeDocCount = Object.values(safeSnap).reduce((s, r) => s + r.length, 0);
      const safeB = {
        id: safeTs, date: fmtDateTime(safeTs), docCount: safeDocCount, type: "pre-restore",
        size: fmtBytes(new TextEncoder().encode(JSON.stringify(safeSnap)).length),
        collections: ALL_COLLECTIONS.length, pinned: false, data: safeSnap,
      };
      saveBackups([safeB, ...backups]);
      reportLines.push(`✓ Safety backup created (${safeDocCount} docs)`);

      let total = 0;
      for (const colId of Object.keys(b.data)) {
        const rows = b.data[colId] || [];
        if (rows.length === 0) {
          reportLines.push(`⟳ ${colId}: empty — skipped`);
          continue;
        }
        await DB_ADAPTER.writeCollection(colId, rows, (done, max) => {
          setProgress({ done, total: max, col: colId });
        });
        total += rows.length;
        reportLines.push(`✓ Restored ${colId}: ${rows.length} records`);
      }

      reportLines.push(`\n📊 Total restored: ${total.toLocaleString()} records`);
      reportLines.push(`📅 From backup: ${b.date}`);
      setSuccessPopup({ title: "Restore Complete", lines: reportLines, ts: Date.now() });
      showToast("success", `Restored ${total} records from backup dated ${b.date}.`);
    } catch (err) {
      showToast("error", "Restore failed: " + err.message);
    }
    setRestoring(false); setProgress({ done: 0, total: 0, col: "" });
    setConfirmRestore(null);
  };

  const downloadBackup = async (b) => {
    const pkg = await buildUDBPackage(ALL_COLLECTIONS.map(c => c.id), b.data);
    const fname = `backup-${fmtDateOnly(b.id)}.udb`;
    downloadBlob(serializeUDB(pkg), fname, "application/json");
    showToast("success", `Downloaded ${fname}`);
  };

  const deleteBackup = (id) => {
    saveBackups(backups.filter(b => b.id !== id));
    setConfirmDelete(null);
  };

  const togglePin = (id) => {
    const updated = backups.map(b => b.id === id ? { ...b, pinned: !b.pinned } : b);
    saveBackups(updated);
    const b = updated.find(x => x.id === id);
    showToast("success", b?.pinned ? "📌 Backup pinned." : "📌 Backup unpinned.");
  };

  const saveSchedule = (s) => {
    setSchedule(s);
    localStorage.setItem(SCHEDULE_KEY, s);
    showToast("success", `Schedule set to: ${s}`);
  };

  const saveRetention = (n) => {
    const limit = Math.max(1, Math.min(50, parseInt(n, 10) || DEFAULT_RETENTION));
    setRetentionLimit(limit);
    localStorage.setItem(RETENTION_KEY, String(limit));
    saveBackups(backups, limit);
    showToast("success", `Retention set to ${limit} backups.`);
  };

  const unpinnedCount = backups.filter(b => !b.pinned).length;
  const pinnedCount   = backups.filter(b => b.pinned).length;

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Backup & Restore</h2>
        <p className="dbm-view-subtitle">Full database snapshots · scheduled backups · retention policy · pin protection</p>
      </div>

      <div className="dbm-mode-tabs">
        {[["backups","💾 Backups"],["settings","⚙️ Schedule & Retention"]].map(([t,l]) => (
          <button key={t} className={`dbm-mode-tab${activeTab === t ? " dbm-mode-tab--active" : ""}`}
            onClick={() => setActiveTab(t)}>{l}</button>
        ))}
      </div>

      {activeTab === "backups" && (
        <div className="udb-panel">
          <div className="dbm-step-card">
            <div className="dbm-backup-actions">
              <button className="btn btn-primary" onClick={createBackup} disabled={creating || restoring}>
                {creating ? "⏳ Creating Backup…" : "💾 Create Full Backup"}
              </button>
              <div className="udb-backup-stats">
                <span>📦 {backups.length} backup{backups.length !== 1 ? "s" : ""}</span>
                {pinnedCount > 0 && <span>📌 {pinnedCount} pinned</span>}
                <span>🗑️ Retain: {retentionLimit} unpinned</span>
                {backups[0] && <span>🕐 Last: {backups[0].date}</span>}
              </div>
            </div>
            {creating && progress.total > 0 && (
              <ProgressBar value={progress.done} max={progress.total}
                label={`Snapshotting ${progress.col}…`} color="blue" />
            )}
          </div>

          {restoring && progress.total > 0 && (
            <div className="dbm-step-card">
              <ProgressBar value={progress.done} max={progress.total}
                label={`Restoring ${progress.col}…`} color="green" />
              <div className="dbm-info-pill">⚠️ Restore in progress — do not close this tab.</div>
            </div>
          )}

          {backups.length === 0 ? (
            <div className="dbm-empty-state">
              <span className="dbm-empty-icon">💾</span>
              <p>No backups yet. Create your first backup above.</p>
            </div>
          ) : (
            <div className="dbm-backup-list">
              {backups.map(b => (
                <div key={b.id} className={`dbm-backup-row${b.type === "pre-restore" ? " dbm-backup-row--safety" : ""}${b.pinned ? " dbm-backup-row--pinned" : ""}`}>
                  <div className="dbm-backup-icon">
                    {b.pinned ? "📌" : b.type === "auto" ? "🔄" : b.type === "pre-restore" ? "🛡️" : "💾"}
                  </div>
                  <div className="dbm-backup-info">
                    <div className="dbm-backup-date">
                      {b.date}
                      {b.pinned && <span className="udb-badge udb-badge--pin">Pinned</span>}
                      {b.type === "auto" && <span className="udb-badge udb-badge--auto">Auto</span>}
                      {b.type === "pre-restore" && <span className="udb-badge udb-badge--safety">Safety</span>}
                    </div>
                    <div className="dbm-backup-meta">
                      {b.docCount.toLocaleString()} docs · {b.size || "—"} · {b.collections} collections
                    </div>
                  </div>
                  <div className="dbm-backup-btns">
                    <button className="btn btn-success btn-sm" onClick={() => setConfirmRestore(b)} disabled={restoring || creating}>
                      🔄 Restore
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadBackup(b)}>
                      ⬇️ .udb
                    </button>
                    <button
                      className={`btn btn-sm ${b.pinned ? "btn-warning" : "btn-secondary"}`}
                      onClick={() => togglePin(b.id)}
                    >
                      {b.pinned ? "📌 Unpin" : "📌 Pin"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(b.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="dbm-info-pill">
            💡 Retention policy: keep the {retentionLimit} most recent unpinned backups. Pinned backups are never auto-deleted.
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="udb-panel">
          <div className="dbm-step-card">
            <div className="dbm-step-header"><h3>Scheduled Backups</h3></div>
            <div className="udb-conflict-grid">
              {[["none","None","Manual only"],
                ["daily","Daily","Auto-backup once per day"],
                ["weekly","Weekly","Auto-backup once per week"],
                ["monthly","Monthly","Auto-backup once per month"]].map(([v,l,d]) => (
                <label key={v} className={`udb-conflict-card${schedule === v ? " udb-conflict-card--active" : ""}`}>
                  <input type="radio" name="schedule" value={v} checked={schedule === v} onChange={() => saveSchedule(v)} />
                  <strong>{l}</strong>
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="dbm-step-card">
            <div className="dbm-step-header"><h3>Retention Policy</h3></div>
            <p className="dbm-view-subtitle dbm-mt">
              Maximum number of <strong>unpinned</strong> backups to keep. Pinned backups are always preserved.
            </p>
            <div className="udb-retention-row">
              <label className="udb-retention-label">Keep at most</label>
              <input
                type="number" className="udb-retention-input"
                min="1" max="50" value={retentionLimit}
                onChange={e => setRetentionLimit(parseInt(e.target.value, 10) || DEFAULT_RETENTION)}
                onBlur={e => saveRetention(e.target.value)}
              />
              <span className="udb-retention-unit">unpinned backups</span>
            </div>
            <div className="udb-retention-presets">
              {[1, 3, 5, 7, 10, 14, 30].map(n => (
                <button key={n} className={`btn btn-sm ${retentionLimit === n ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => saveRetention(n)}>{n}</button>
              ))}
            </div>
            <div className="dbm-info-pill">
              📊 Current: {unpinnedCount} unpinned · {pinnedCount} pinned · {backups.length} total
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteBackup(confirmDelete)}
        title="Delete Backup"
        message="Permanently delete this backup?"
        danger
        confirmLabel="Delete Backup"
        affectedInfo={["⚠️ The backup data will be permanently removed from local storage."]}
      />

      <ConfirmModal
        open={!!confirmRestore}
        onClose={() => setConfirmRestore(null)}
        onConfirm={() => restoreBackup(confirmRestore)}
        title="Restore from Backup"
        message={`Restore from backup dated ${confirmRestore?.date}?`}
        confirmLabel="Restore Now"
        affectedInfo={[
          `📅 Backup date: ${confirmRestore?.date}`,
          `📊 Documents: ${confirmRestore?.docCount?.toLocaleString()}`,
          `🛡️ A pre-restore safety backup will be created automatically.`,
        ]}
      />

      <SuccessPopup
        open={!!successPopup}
        onClose={() => setSuccessPopup(null)}
        title={successPopup?.title}
        lines={successPopup?.lines || []}
        ts={successPopup?.ts}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VIEW: ANALYTICS
═══════════════════════════════════════════════════════════ */
function AnalyticsView({ stats, statsLoading }) {
  const items = [
    { label: "Total Collections", value: ALL_COLLECTIONS.length, icon: "🗂️" },
    { label: "Total Documents",   value: stats.totalDocs,        icon: "📄" },
    { label: "Total Users",       value: stats.users,            icon: "👥" },
    { label: "Exam Attempts",     value: stats.examAttempts,     icon: "📝" },
    { label: "Exam Results",      value: stats.results,          icon: "🏆" },
    { label: "Analytics Records", value: stats.userAnalytics,    icon: "📊" },
    { label: "Questions",         value: stats.questions,        icon: "❓" },
    { label: "Subjects",          value: stats.subjects,         icon: "📚" },
    { label: "Topics",            value: stats.topics,           icon: "🗂️" },
    { label: "Subtopics",         value: stats.subtopics,        icon: "🔖" },
  ];

  return (
    <div className="dbm-view">
      <div className="dbm-view-header">
        <h2 className="dbm-view-title">Database Analytics</h2>
        <p className="dbm-view-subtitle">Document counts and proportional usage across all collections</p>
      </div>
      <div className="dbm-analytics-grid">
        {items.map(it => (
          <div key={it.label} className="dbm-analytics-row">
            <span className="dbm-analytics-icon">{it.icon}</span>
            <div className="dbm-analytics-bar-wrap">
              <div className="dbm-analytics-label">{it.label}</div>
              <div className="dbm-analytics-bar">
                <div className="dbm-analytics-bar-fill"
                  style={{ width: stats.totalDocs ? `${Math.min(100, ((it.value || 0) / (stats.totalDocs || 1)) * 100)}%` : "0%" }} />
              </div>
            </div>
            <span className="dbm-analytics-val">{statsLoading ? "…" : (it.value ?? 0).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════ */
export default function DatabaseManagement() {
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useRole();
  const [view, setView]               = useState(VIEWS.OVERVIEW);
  const [stats, setStats]             = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [toast, setToast]             = useState(null);

  useEffect(() => {
    (async () => {
      const counts = {};
      let total = 0;
      for (const col of ALL_COLLECTIONS) {
        try {
          const n = await DB_ADAPTER.countCollection(col.id);
          counts[col.id] = n;
          total += n;
        } catch { counts[col.id] = 0; }
      }
      counts.totalDocs = total;
      setStats(counts);
      setStatsLoading(false);
    })();
  }, []);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  if (roleLoading) {
    return <div className="loading-overlay"><div className="loading-spinner" /></div>;
  }

  if (!isAdmin && !isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="dbm-access-denied">
          <span>🔒</span>
          <h2>Access Restricted</h2>
          <p>Database Management is only available to Admins and Super Admins.</p>
        </div>
      </AdminLayout>
    );
  }

  const NAV_ITEMS = [
    { id: VIEWS.OVERVIEW,  icon: "🏠", label: "Overview" },
    { id: VIEWS.EXPLORER,  icon: "🔍", label: "Explorer" },
    { id: VIEWS.USERS,     icon: "👥", label: "Users" },
    { id: VIEWS.DELETE,    icon: "🗑️",  label: "Delete" },
    { id: VIEWS.EXPORT,    icon: "📦", label: "Export" },
    { id: VIEWS.IMPORT,    icon: "📥", label: "Import" },
    { id: VIEWS.BACKUP,    icon: "💾", label: "Backup" },
    { id: VIEWS.ANALYTICS, icon: "📈", label: "Analytics" },
  ];

  return (
    <AdminLayout>
      <div className="top-navbar">
        <div className="nav-left">
          <span className="dbm-page-icon">🗄️</span>
          <div>
            <h2 className="dbm-page-title">Database Management</h2>
            <p className="dbm-page-sub">Universal Database Engine · {DB_ADAPTER.icon} {DB_ADAPTER.name}</p>
          </div>
        </div>
        <div className="nav-right">
          <span className="chip chip-purple">📦 UDB v{UDB_FORMAT_VERSION}</span>
          <span className="chip chip-green">🛡️ {isSuperAdmin ? "Super Admin" : "Admin"}</span>
        </div>
      </div>

      <div className="dbm-subnav">
        {NAV_ITEMS.map(n => (
          <button key={n.id}
            className={`dbm-subnav-btn${view === n.id ? " dbm-subnav-btn--active" : ""}`}
            onClick={() => setView(n.id)}>
            <span>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      {view === VIEWS.OVERVIEW  && <OverviewView  stats={stats} statsLoading={statsLoading} setView={setView} />}
      {view === VIEWS.EXPLORER  && <ExplorerView />}
      {view === VIEWS.USERS     && <UsersView />}
      {view === VIEWS.DELETE    && <DeleteView    showToast={showToast} />}
      {view === VIEWS.EXPORT    && <ExportView    showToast={showToast} />}
      {view === VIEWS.IMPORT    && <ImportView    showToast={showToast} />}
      {view === VIEWS.BACKUP    && <BackupView    showToast={showToast} />}
      {view === VIEWS.ANALYTICS && <AnalyticsView stats={stats} statsLoading={statsLoading} />}

      <Toast toast={toast} />
    </AdminLayout>
  );
}
