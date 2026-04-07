/**
 * Server-side HTML sanitizer.
 *
 * Strips all HTML/XML tags from a string so that user-supplied text fields
 * (notes, description, reason, etc.) cannot store raw markup that could be
 * reflected as XSS in emails or future rich-text renderers.
 *
 * DOMPurify requires a browser DOM and cannot run in a Node.js Server Action.
 * This thin wrapper uses a well-understood regex approach that is safe for
 * plain-text fields: it removes every `<...>` sequence and decodes a small set
 * of HTML entities back to their printable equivalents.
 */

const TAG_RE      = /<[^>]*>/g
const ENTITY_MAP: Record<string, string> = {
  '&amp;':  '&',
  '&lt;':   '<',
  '&gt;':   '>',
  '&quot;': '"',
  '&#39;':  "'",
  '&nbsp;': ' ',
}
const ENTITY_RE = /&(?:amp|lt|gt|quot|#39|nbsp);/g

/**
 * Strip all HTML tags and decode basic entities from `input`.
 * Returns `undefined` when input is `null | undefined`.
 */
export function sanitizeText(input: string | null | undefined): string | undefined {
  if (input == null) return undefined
  return input
    .replace(TAG_RE, '')
    .replace(ENTITY_RE, (e) => ENTITY_MAP[e] ?? e)
    .trim()
}

/**
 * Same as `sanitizeText` but returns `null` instead of `undefined` so it can
 * be passed directly to Prisma nullable fields.
 */
export function sanitizeTextNullable(input: string | null | undefined): string | null {
  const v = sanitizeText(input)
  return v != null ? v : null
}
