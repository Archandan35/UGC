/**
 * data-layer/revision.js
 * Knows NOTHING about any database provider. Delegates everything to provider.
 */
import { provider } from "../data-provider";

export const getRevisionPool = (uid, opts) => provider.getRevisionPool(uid, opts);
