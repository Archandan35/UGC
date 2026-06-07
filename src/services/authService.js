// Redirect shim — all consumers should migrate to: import { ... } from "../data-layer"
export {
  registerEmail, loginEmail, loginGoogle,
  resetPassword, logout, setDisplayName,
} from "../data-layer";
