/**
 * Larkspur — Cloudflare Pages advanced-mode worker.
 * Adds security headers, caching hints and a friendly 404 across every route.
 * Static assets keep their own long-lived cache headers; HTML revalidates.
 */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function decorate(response, cacheControl) {
  const out = new Response(response.body, response);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    out.headers.set(key, value);
  }
  out.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  if (cacheControl) out.headers.set("Cache-Control", cacheControl);
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    // Block common probe paths quietly.
    if (/^\/(wp-admin|wp-login|\.env|\.git|vendor|phpmyadmin)/i.test(pathname)) {
      return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
    }

    let response;
    try {
      response = await env.ASSETS.fetch(request);
    } catch (error) {
      return new Response("Something burned. Try again.", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (response.status === 404 && contentType.includes("text/html")) {
      const notFound = await env.ASSETS.fetch(new URL("/404.html", url.origin));
      return decorate(notFound, "public, max-age=0, must-revalidate");
    }

    if (pathname.startsWith("/assets/")) {
      return decorate(response, "public, max-age=31536000, immutable");
    }

    if (pathname.startsWith("/journal/") && contentType.includes("text/html")) {
      return decorate(response, "public, max-age=0, s-maxage=86400");
    }

    return decorate(response, "public, max-age=0, must-revalidate");
  },
};
