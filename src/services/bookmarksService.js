// Redirect shim — all consumers should migrate to: import { ... } from "../data-layer"
export {
  fetchBookmarks, addBookmark, removeBookmark, syncBookmarks,
} from "../data-layer";
