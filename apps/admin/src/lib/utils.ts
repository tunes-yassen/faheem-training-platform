import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSAR(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 6) return '••••••';
  return '••••••••••••' + value.slice(-4);
}

export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
) {
  if (!rows.length) return;
  const cols = headers ?? Object.keys(rows[0]).map((k) => ({ key: k as keyof T, label: k }));
  const headerLine = cols.map((c) => `"${String(c.label).replace(/"/g, '""')}"`).join(',');
  const dataLines = rows.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  // UTF-8 BOM for proper Arabic display in Excel
  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
