/**
 * CSV export.
 *
 * RFC 4180 throughout, because the file is going into a spreadsheet and the
 * formatting options mean a UUID can legitimately arrive already wrapped in
 * double quotes — the exact case naive joining gets wrong.
 */

export interface CsvRow {
  index: number;
  uuid: string;
  version: string;
  /** ISO-8601, UTC. */
  generatedAt: string;
}

export const CSV_HEADER = ['index', 'uuid', 'version', 'generated_at'] as const;

/** RFC 4180 §2.1: records end with CRLF. */
const CRLF = '\r\n';

/**
 * Excel reads a UTF-8 file as the local ANSI codepage unless it sees this.
 * Kept out of `toCsv` so the CSV text stays clean and testable on its own.
 */
export const CSV_BOM = '﻿';

/**
 * Quote a field if it contains a comma, a double quote, CR or LF; double up any
 * embedded quotes (RFC 4180 §2.5–2.7).
 */
export function escapeField(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export function toCsv(rows: CsvRow[]): string {
  const lines = [CSV_HEADER.join(',')];

  for (const row of rows) {
    lines.push(
      [
        String(row.index),
        escapeField(row.uuid),
        escapeField(row.version),
        escapeField(row.generatedAt),
      ].join(','),
    );
  }

  // Trailing CRLF: RFC 4180 allows it, and POSIX tools expect a final newline.
  return lines.join(CRLF) + CRLF;
}

/** Byte length of the file as it would be written, BOM included. */
export function csvByteLength(csv: string): number {
  return new TextEncoder().encode(CSV_BOM + csv).length;
}

/** Two digits, for the filename stamp. */
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * `uuidly-<version>-<count>-<yyyymmdd-hhmmss>.csv`
 *
 * Stamped in UTC so the name is unambiguous no matter where it was downloaded,
 * and matches the `generated_at` column rather than disagreeing with it.
 */
export function csvFilename(version: string, count: number, now: Date): string {
  const stamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `uuidly-${version}-${count}-${stamp}.csv`;
}

/**
 * Hand the CSV to the browser's downloader.
 *
 * A blob URL and a synthetic anchor click, which needs no `downloads`
 * permission — worth a few lines to keep the manifest at one permission.
 * Returns false if the DOM refused, so the caller can offer "copy all" instead.
 */
export function downloadCsv(filename: string, csv: string): boolean {
  let url: string | undefined;
  try {
    const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8' });
    url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    return false;
  } finally {
    // Next tick: revoking synchronously can cancel the download in some engines.
    if (url) {
      const created = url;
      setTimeout(() => URL.revokeObjectURL(created), 0);
    }
  }
}
