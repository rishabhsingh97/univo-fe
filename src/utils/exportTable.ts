import { isValidElement, type ReactNode } from 'react';
import ExcelJS from 'exceljs';
import type { DataTableColumn } from '../components/ui/DataTable';

/**
 * Best-effort plain-text extraction from a rendered cell's ReactNode tree - the default export
 * value for a column that doesn't declare its own `exportValue`. Walks elements' `children` and
 * concatenates string/number leaves; ignores everything else (icons, buttons, null). Good
 * enough for most cells (badges, plain text) but flattens a two-line stacked cell into one
 * space-joined string - a column where that reads badly should declare an explicit
 * `exportValue` instead of relying on this fallback.
 */
export function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).filter(Boolean).join(' ');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return nodeToText(props.children);
  }
  return '';
}

export function buildExportTable<T>(
  columns: DataTableColumn<T>[],
  rows: T[],
): { header: string[]; body: (string | number)[][] } {
  const header = columns.map((c) => c.header);
  const body = rows.map((row) => columns.map((c) => (c.exportValue ? c.exportValue(row) : nodeToText(c.render(row)))));
  return { header, body };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadCsv(filenameBase: string, header: string[], body: (string | number)[][]) {
  const lines = [header, ...body].map((row) => row.map(csvEscape).join(','));
  // Leading BOM so Excel opens the file as UTF-8 instead of guessing the system codepage.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filenameBase}.csv`);
}

export async function downloadXlsx(filenameBase: string, header: string[], body: (string | number)[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.columns = header.map((h) => ({ header: h, width: 18 }));
  body.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${filenameBase}.xlsx`);
}
