// Redirect shim — all consumers should migrate to: import { ... } from "../data-layer"
export {
  createSubject as addSubject,
  deleteSubject,
  updateSubject,
  subscribeSubjects as listenSubjects,
} from "../data-layer";
