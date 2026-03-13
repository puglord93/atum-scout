/**
 * Export utilities for ATUM Scout
 * Generates and triggers CSV downloads from filtered table data
 */

type Row = Record<string, string | number | boolean | null | undefined>;

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(rows: Row[], columns: { key: string; label: string }[], filename: string) {
  const header = columns.map(c => escapeCsvValue(c.label)).join(',');
  const body = rows.map(row =>
    columns.map(c => escapeCsvValue(row[c.key])).join(',')
  );

  const csv = [header, ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
