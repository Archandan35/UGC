import { useEffect } from "react";

/**
 * Lightweight SEO hook for an SPA — no extra dependency.
 * Sets document.title + meta description + canonical + OG tags per route.
 *
 * Usage:
 *   useSeo({ title: "Pricing — OdiaExams", description: "Free vs Pro plans" });
 */
function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href) {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo({ title, description, path = "", noIndex = false } = {}) {
  useEffect(() => {
    const siteUrl = (import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "");
    if (title) document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    if (siteUrl) {
      upsertMeta("property", "og:url", `${siteUrl}${path}`);
      upsertCanonical(`${siteUrl}${path}`);
    }
    upsertMeta("name", "robots", noIndex ? "noindex,nofollow" : "index,follow");
  }, [title, description, path, noIndex]);
}

export default useSeo;
