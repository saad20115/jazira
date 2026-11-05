/**
 * Safely serializes a value for embedding inside a `<script type="application/ld+json">` tag.
 *
 * Escapes `<`, `>`, `&`, `U+2028` (LINE SEPARATOR), and `U+2029` (PARAGRAPH SEPARATOR) as
 * four-digit Unicode escape sequences so untrusted or editor-controlled strings (e.g.
 * `</script><meta http-equiv=refresh ...>`) can never break out of the script element,
 * while remaining 100% valid JSON (`JSON.parse` restores the exact original values).
 */
export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value) ?? 'null'
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
