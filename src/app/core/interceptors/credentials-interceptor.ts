// credentials-interceptor.ts
//
// Slice 3 (shared-auth-cross-origin): cross-origin credential carrier.
//
// gem-web and gem-docs both fetch from gem-api under a parent domain
// (.julitorossian.dev for test) or from another origin altogether (prod-LAN
// uses placeholder LAN IPs; dev uses localhost across ports). Browsers only
// attach the auth cookie on cross-origin XHRs when `withCredentials: true`
// is set on the request AND the server's CORS allowlist echoes the origin
// with `Access-Control-Allow-Credentials: true`. The server side is wired in
// Slice 1 (`gem-api/src/main.ts` + `cookie-builder.ts`); this interceptor is
// the client side.
//
// Behaviour
// - Clones requests whose URL targets `environment.apiBaseUrl` and tags the
//   clone with `withCredentials: true`.
// - Pass-through for any other URL (gem-internal static assets, gem-docs
//   public landing, etc.):
//   - the interceptor MUST NOT add `withCredentials: true` to unrelated
//     calls because that breaks `Authorization: Bearer <jwt>` semantics on
//     same-origin calls (the auth-interceptor already attaches the bearer;
//     the credentials-interceptor just adds the cookie flag on cross-origin
//     hops — the bearer header is per request and cookie is per origin, so
//     they coexist).
//
// Pure functional HttpInterceptorFn; no DI, no global state.
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@/environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Match by URL prefix against the configured apiBaseUrl. When apiBaseUrl is
  // empty (the default `environment.ts` stub used by Karma), the interceptor
  // is a no-op pass-through — there is no cross-origin target configured, so
  // cloning with `withCredentials: true` would be a false positive on every
  // same-origin relative request. Production builds replace `environment.ts`
  // via `angular.json` fileReplacements (development / gaci / gaciTest) and
  // those builds always declare a non-empty apiBaseUrl.
  const apiBase = environment.apiBaseUrl;
  if (!apiBase || !req.url || !req.url.startsWith(apiBase)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
