// is-trusted-return-url.spec.ts
// Strict-TDD-inversion seed (REQ-seeding-specs-gem-web, Slice 2 anchor).
// RED on origin/desa: the `isTrustedReturnUrl` symbol is unresolved at this commit
// because the helper file under src/app/core/utils/ has not been added yet.
// After Slice 2 commit lands the helper, this spec flips GREEN.
//
// The helper under test:
//   isTrustedReturnUrl(url: string, allowed: string[]): boolean
// Pure function, caller passes the allowlist (no @angular/* imports, no env
// reads). Falseness is exhaustive: empty/null input, parse errors,
// relative-only schemes (no http(s)), javascript: and other exotic schemes,
// port mismatches, scheme mismatches, and unknown allowlist entries.

import { isTrustedReturnUrl } from '@core/utils/is-trusted-return-url'

describe('isTrustedReturnUrl', () => {
  describe('allowlist hit (positive)', () => {
    it('returns true for an exact-origin match on https', () => {
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev/welcome', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeTrue()
    })

    it('returns true for an exact-origin match on http (dev localhost)', () => {
      expect(
        isTrustedReturnUrl('http://localhost:4201/welcome', [
          'http://localhost:4201',
          'http://localhost:4200',
        ]),
      ).toBeTrue()
    })

    it('returns true for a Prod-LAN IP allowlist hit', () => {
      expect(
        isTrustedReturnUrl('http://192.168.68.110:4000/dashboard', [
          'http://192.168.68.110:4000',
        ]),
      ).toBeTrue()
    })

    it('matches when allowlist entry has a trailing slash', () => {
      // Allowlist stores canonical origins via `new URL(a).origin`, so trailing
      // slash and any path are normalized away before comparison.
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev/welcome', [
          'https://gem-docs.julitorossian.dev/',
        ]),
      ).toBeTrue()
    })

    it('matches when URL has a query string and the path matches', () => {
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev/welcome?lang=es', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeTrue()
    })
  })

  describe('allowlist miss (negative)', () => {
    it('returns false when host is not in the allowlist', () => {
      expect(
        isTrustedReturnUrl('https://evil.com/x', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })

    it('returns false when allowlist is empty', () => {
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev/welcome', []),
      ).toBeFalse()
    })

    it('returns false when allowlist contains an unknown entry that fails to parse', () => {
      // `not-a-uri` cannot be parsed by `new URL`, so the allowlist reduces to
      // an empty origin set and the call returns false.
      expect(
        isTrustedReturnUrl(
          'https://gem-docs.julitorossian.dev/welcome',
          ['not-a-uri'],
        ),
      ).toBeFalse()
    })

    it('returns false when port is present on URL but not on allowlist', () => {
      // The helper compares protocol+host(+port), so a different port is a
      // distinct origin even when hostnames match.
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev:8443/welcome', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })

    it('returns false when port is missing on URL but allowlist has a non-default explicit port', () => {
      // The browser URL standard collapses default ports (443 for https, 80 for
      // http) into the host string, so :443 here is NOT a different origin
      // from the bare https:// entry. We use :8443 to exercise the port
      // mismatch path on the allowlist side.
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev/welcome', [
          'https://gem-docs.julitorossian.dev:8443',
        ]),
      ).toBeFalse()
    })

    it('returns true when explicit port on URL matches the allowlist non-default port', () => {
      expect(
        isTrustedReturnUrl('https://gem-docs.julitorossian.dev:8443/welcome', [
          'https://gem-docs.julitorossian.dev:8443',
        ]),
      ).toBeTrue()
    })

    it('returns false on scheme mismatch (http vs https)', () => {
      expect(
        isTrustedReturnUrl('http://gem-docs.julitorossian.dev/welcome', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })

    it('returns false when subdomain differs (subdomain.takeover.evil.com)', () => {
      expect(
        isTrustedReturnUrl('https://evil.gem-docs.julitorossian.dev/welcome', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })
  })

  describe('parse errors / unsafe input', () => {
    it('returns false on a parse error (not-a-url)', () => {
      expect(isTrustedReturnUrl('not-a-url', ['https://x.test'])).toBeFalse()
    })

    it('returns false for an empty or whitespace string', () => {
      expect(isTrustedReturnUrl('', ['https://x.test'])).toBeFalse()
      expect(isTrustedReturnUrl('   ', ['https://x.test'])).toBeFalse()
    })

    it('returns false for a relative path-only URL with no scheme', () => {
      expect(isTrustedReturnUrl('/foo', ['https://x.test'])).toBeFalse()
    })

    it('returns false for javascript: payload (open-redirect guard)', () => {
      expect(
        isTrustedReturnUrl('javascript:alert(1)', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })

    it('returns false for data: payload (open-redirect guard)', () => {
      expect(
        isTrustedReturnUrl('data:text/html,<script>alert(1)</script>', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })

    it('returns false for file: payload', () => {
      expect(
        isTrustedReturnUrl('file:///etc/passwd', [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })

    it('returns false when input is not a string', () => {
      // The helper rejects unknown types up front to harden the redirect gate.
      expect(
        isTrustedReturnUrl(null as unknown as string, [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
      expect(
        isTrustedReturnUrl(undefined as unknown as string, [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
      expect(
        isTrustedReturnUrl(42 as unknown as string, [
          'https://gem-docs.julitorossian.dev',
        ]),
      ).toBeFalse()
    })
  })

  describe('invariants', () => {
    it('does NOT do substring matching on the input', () => {
      // A naive `String.includes(origin)` would falsely match.
      // Origin is computed as `protocol://host` so path and query are stripped.
      expect(
        isTrustedReturnUrl(
          'https://evil.com/#https://gem-docs.julitorossian.dev',
          ['https://gem-docs.julitorossian.dev'],
        ),
      ).toBeFalse()
    })

    it('does not import @angular/* or any env module (pure helper)', async () => {
      // Static check: if the helper accidentally pulled in Angular DI or the
      // environment, the test module would not need a direct import — but this
      // assertion documents the contract for future readers.
      const mod = await import('@core/utils/is-trusted-return-url')
      const source = mod.isTrustedReturnUrl.toString()
      expect(source).not.toContain('inject')
      expect(source).not.toContain('@angular')
      expect(source).not.toContain('environment')
    })
  })
})
