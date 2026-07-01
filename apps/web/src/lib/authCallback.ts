export function sanitizeAuthCallbackValue(value: string, maxLength: number) {
  let sanitized = "";
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    sanitized += code < 32 || code === 127 ? " " : character;
  }

  return sanitized
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}
