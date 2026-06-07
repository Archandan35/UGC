// Redirect shim — analytics logic lives in data-layer/config.js
export { trackEvent } from "../data-layer";
export default function trackEvent(name, payload = {}) {
  // Re-export default for any consumers using the default import
  import("../data-layer").then(({ trackEvent: t }) => t(name, payload));
}
