import { useEffect } from 'react';
import { KINDS, type UuidKind } from '@/lib/uuid';

/** docs/DESIGN.md §8. */

interface HotkeyHandlers {
  onSelect: (kind: UuidKind) => void;
  onRefresh: () => void;
  onCopy: () => void;
  onClose: () => void;
}

/** Typing in a field must never trigger a shortcut. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Space and Enter belong to whatever control currently has focus. */
function isOnControl(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  return (
    ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) ||
    el.getAttribute('role') === 'button' ||
    el.getAttribute('role') === 'tab'
  );
}

/**
 * One `keydown` listener on the document, rather than per-component handlers.
 * The popup is small enough that a single place to read the whole keyboard map
 * is worth more than locality.
 */
export function useHotkeys({ onSelect, onRefresh, onCopy, onClose }: HotkeyHandlers) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey || isTyping(event.target)) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        // Let the browser handle Ctrl+C when the user has selected text —
        // hijacking it would copy the wrong thing.
        if (event.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
          event.preventDefault();
          onCopy();
        }
        return;
      }

      // 1-5 pick a version, in the order the tabs are displayed.
      const digit = Number.parseInt(event.key, 10);
      if (digit >= 1 && digit <= KINDS.length) {
        event.preventDefault();
        onSelect(KINDS[digit - 1]!);
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          event.preventDefault();
          onRefresh();
          break;
        case 'c':
          event.preventDefault();
          onCopy();
          break;
        case ' ':
          // Space activates a focused control; only claim it when nothing is focused.
          if (!isOnControl()) {
            event.preventDefault();
            onRefresh();
          }
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSelect, onRefresh, onCopy, onClose]);
}
