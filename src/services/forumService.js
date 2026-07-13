// Redirect shim — all consumers should migrate to: import { ... } from "../data-layer"
export {
  listThreads, getThread, listReplies, createThread, postReply,
} from "../data-layer";
