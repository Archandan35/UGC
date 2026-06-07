/**
 * data-layer/index.js — Public API gateway.
 *
 * ╔═══════════════════════════════════════════════════════╗
 * ║  Pages / Admin / Components / Hooks import ONLY from  ║
 * ║  here (or from specific sub-modules like data-layer/  ║
 * ║  database.js for the universal abstraction).          ║
 * ║                                                       ║
 * ║  NEVER import from:                                   ║
 * ║    data-provider/data-info.js                         ║
 * ║    lib/supabase.js                                    ║
 * ║    firebase/*                                         ║
 * ║    @supabase/supabase-js                              ║
 * ╚═══════════════════════════════════════════════════════╝
 */

// Universal database abstraction (subscribe, fetchAll, fetchOne, etc.)
export * from "./database";

// Domain modules
export * from "./auth";
export * from "./users";
export * from "./subjects";
export * from "./topics";
export * from "./subtopics";
export * from "./questions";
export * from "./results";
export * from "./bookmarks";
export * from "./forum";
export * from "./config";
export * from "./gamification";
export * from "./studyplans";
export * from "./revision";
