// is-trusted-return-url.ts
// Single source of truth for "is this `returnUrl` a URL we may safely redirect
// the browser to from gem-web?". Used by the sign-in view (line 145 in
// loginOk()) and any future gem-docs/gem-bot-discord consumer that copies the
// helper per design DR-6.
//
// Pure: no DI, no env access, no @angular/* imports. The caller passes the
// allowlist from `environment.trustedReturnOrigins` so this file stays
// deterministic and unit-testable.
//
// Returns `false` for EVERY non-trivial edge case (parse errors, relative-only
// schemes, javascript:/data:/file:, port mismatches, scheme mismatches, unknown
// allowlist entries). This is the IEQ contract for the open-redirect guard
// REQ-open-redirect-guard.
//
// Spec: gem-web/src/spec/is-trusted-return-url.spec.ts (≥8 expect cases).
// Design: openspec/changes/shared-auth-cross-origin/design.md § 6.

export function isTrustedReturnUrl(url: string, allowed: string[]): boolean {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return false
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  // Block every non-http(s) scheme up front. Covers javascript:, data:, file:,
  // blob:, vbscript:, etc., before origin computation.
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return false
  }

  const origin = `${parsed.protocol}//${parsed.host}`
  const allowedOrigins = allowed
    .filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
    .map((entry) => {
      try {
        return new URL(entry).origin
      } catch {
        return ''
      }
    })
    .filter((value) => value.length > 0)

  return allowedOrigins.includes(origin)
}
