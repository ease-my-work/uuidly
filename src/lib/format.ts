/**
 * Presentation of a UUID. Pure, no imports — formatting never regenerates the
 * value (F-23), so this module must not know how UUIDs are made.
 */

export type Wrapper = 'none' | 'braces' | 'quotes' | 'urn';

export interface FormatOpts {
  uppercase: boolean;
  hyphens: boolean;
  wrapper: Wrapper;
}

export const DEFAULT_FORMAT: FormatOpts = {
  uppercase: false,
  hyphens: true,
  wrapper: 'none',
};

/** The order the wrapper chip cycles through — docs/DESIGN.md §7.6. */
export const WRAPPERS: Wrapper[] = ['none', 'braces', 'quotes', 'urn'];

/** Chip face. `none` shows the braces glyph in its inactive state. */
export const WRAPPER_LABEL: Record<Wrapper, string> = {
  none: '{ }',
  braces: '{ }',
  quotes: '" "',
  urn: 'urn:',
};

/** Spoken name, for `aria-label` — a glyph alone tells a screen reader nothing. */
export const WRAPPER_NAME: Record<Wrapper, string> = {
  none: 'no wrapper',
  braces: 'braces',
  quotes: 'double quotes',
  urn: 'urn:uuid: prefix',
};

export function nextWrapper(current: Wrapper): Wrapper {
  const index = WRAPPERS.indexOf(current);
  return WRAPPERS[(index + 1) % WRAPPERS.length]!;
}

/**
 * Render `raw` (canonical, lowercase, hyphenated) for display and copying.
 *
 * Order is fixed: strip hyphens, then apply case, then wrap. Wrapping last means
 * the delimiters are never swept up by the case change — which matters for the
 * `urn:uuid:` prefix, since RFC 9562 §4 defines it in lowercase regardless of
 * how the UUID itself is cased.
 */
export function applyFormat(raw: string, opts: FormatOpts): string {
  let out = opts.hyphens ? raw : raw.replaceAll('-', '');
  if (opts.uppercase) out = out.toUpperCase();

  switch (opts.wrapper) {
    case 'braces':
      return `{${out}}`;
    case 'quotes':
      return `"${out}"`;
    case 'urn':
      return `urn:uuid:${out}`;
    case 'none':
      return out;
  }
}
