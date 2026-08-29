import { storage } from 'wxt/utils/storage';
import { DEFAULT_FORMAT, type FormatOpts } from './format';
import { DEFAULT_KIND, type UuidKind } from './uuid';

/**
 * The three values this extension stores, all in `chrome.storage.local`, all on
 * the user's own machine. This list is the whole of what SECURITY.md promises —
 * adding a fourth means updating that document.
 *
 * Every item has a fallback, so a first run reads defaults without ever writing.
 */

export const kindPref = storage.defineItem<UuidKind>('local:kind', {
  fallback: DEFAULT_KIND,
});

export const formatPref = storage.defineItem<FormatOpts>('local:format', {
  fallback: DEFAULT_FORMAT,
});

export const countPref = storage.defineItem<number>('local:count', {
  fallback: 10,
});
