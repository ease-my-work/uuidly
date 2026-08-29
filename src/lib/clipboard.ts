/**
 * Clipboard writes.
 *
 * The popup is a focused secure context, so `navigator.clipboard` works inside a
 * user-gesture handler without the `clipboardWrite` permission. Keeping that
 * permission off the manifest is worth the small fallback below — see SECURITY.md.
 */

/**
 * Copy `text` to the clipboard. Returns whether it worked.
 *
 * Must be called synchronously from a user gesture: browsers reject clipboard
 * writes that arrive later, and the promise rejection is the only signal.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied, document not focused, or an older engine. Try the
    // fallback rather than reporting failure straight away.
  }

  return legacyCopy(text);
}

/**
 * `document.execCommand('copy')` via an offscreen textarea.
 *
 * Deprecated, and deliberately kept: it is the only path on older Firefox ESR,
 * which matters from v1.1.0. It costs a few lines and nothing at runtime.
 */
function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Off-screen rather than hidden: `display: none` elements cannot be selected.
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
