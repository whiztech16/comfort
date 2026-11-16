import { useEffect } from "react";

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

type Seo = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
};

function upsert(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  set(el);
}

function meta(attr: "name" | "property", key: string, content: string) {
  upsert(
    `meta[${attr}="${key}"]`,
    () => {
      const el = document.createElement("meta");
      el.setAttribute(attr, key);
      return el;
    },
    (el) => el.setAttribute("content", content)
  );
}

function canonical(href: string) {
  upsert(
    'link[rel="canonical"]',
    () => {
      const el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      return el;
    },
    (el) => el.setAttribute("href", href)
  );
}

export function useSeo({ title, description, path, image, noindex = false }: Seo) {
  useEffect(() => {
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const picture = image ?? DEFAULT_IMAGE;

    document.title = title;
    meta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    meta("property", "og:title", title);
    meta("property", "og:url", url);
    meta("property", "og:image", picture);
    meta("name", "twitter:title", title);
    meta("name", "twitter:image", picture);
    if (description) {
      meta("name", "description", description);
      meta("property", "og:description", description);
      meta("name", "twitter:description", description);
    }
    canonical(url);
  }, [title, description, path, image, noindex]);
}