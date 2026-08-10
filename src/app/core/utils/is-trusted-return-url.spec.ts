import { isTrustedReturnUrl } from './is-trusted-return-url'

describe('isTrustedReturnUrl', () => {
  const trustedOrigins = ['https://app.example.com', 'http://localhost:4200']

  it('accepts an absolute URL with an exactly trusted origin', () => {
    expect(isTrustedReturnUrl('https://app.example.com/dashboard?tab=1', trustedOrigins)).toBeTrue()
  })

  it('rejects a similar host', () => {
    expect(isTrustedReturnUrl('https://app.example.com.evil.test/dashboard', trustedOrigins)).toBeFalse()
  })

  it('rejects a different protocol', () => {
    expect(isTrustedReturnUrl('http://app.example.com/dashboard', trustedOrigins)).toBeFalse()
  })

  it('rejects a different port', () => {
    expect(isTrustedReturnUrl('https://app.example.com:8443/dashboard', trustedOrigins)).toBeFalse()
  })

  it('rejects a relative URL', () => {
    expect(isTrustedReturnUrl('/dashboard', trustedOrigins)).toBeFalse()
  })

  it('rejects embedded credentials', () => {
    expect(isTrustedReturnUrl('https://user:password@app.example.com/dashboard', trustedOrigins)).toBeFalse()
  })

  it('rejects wildcard origins', () => {
    expect(isTrustedReturnUrl('https://tenant.example.com/dashboard', ['https://*.example.com'])).toBeFalse()
  })

  it('rejects non-web protocols and empty origins', () => {
    expect(isTrustedReturnUrl('javascript:alert(1)', trustedOrigins)).toBeFalse()
    expect(isTrustedReturnUrl('https://app.example.com/dashboard', ['', '  '])).toBeFalse()
  })

  it('rejects an allowlist entry that is not an origin', () => {
    expect(isTrustedReturnUrl('https://app.example.com/dashboard', ['https://app.example.com/path'])).toBeFalse()
  })
})
