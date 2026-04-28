/** Conditionally join class names — handles undefined/false/null gracefully. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
