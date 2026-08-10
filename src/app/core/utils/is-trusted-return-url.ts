export function isTrustedReturnUrl(
  returnUrl: unknown,
  trustedOrigins: readonly string[] | unknown,
): returnUrl is string {
  if (typeof returnUrl !== 'string' || !Array.isArray(trustedOrigins)) {
    return false
  }

  let parsedReturnUrl: URL
  try {
    parsedReturnUrl = new URL(returnUrl)
  } catch {
    return false
  }

  if (
    !['http:', 'https:'].includes(parsedReturnUrl.protocol) ||
    parsedReturnUrl.username ||
    parsedReturnUrl.password
  ) {
    return false
  }

  return trustedOrigins.some(origin => {
    if (typeof origin !== 'string' || !origin.trim()) {
      return false
    }

    try {
      const parsedOrigin = new URL(origin)
      return (
        ['http:', 'https:'].includes(parsedOrigin.protocol) &&
        !parsedOrigin.username &&
        !parsedOrigin.password &&
        parsedOrigin.pathname === '/' &&
        !parsedOrigin.search &&
        !parsedOrigin.hash &&
        !parsedOrigin.hostname.includes('*') &&
        parsedOrigin.origin === parsedReturnUrl.origin
      )
    } catch {
      return false
    }
  })
}
