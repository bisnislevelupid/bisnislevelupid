"use client";

import { useMemo, useState, type ReactNode } from "react";
import { statusColor, statusText } from "@/lib/admin/format";

export type GridColumn<T> = {
  key: string;
  label: string;
  value: (row: T) => string;
  render?: (row: T) => ReactNode;
};

type FilterOp = "berisi" | "sama" | "mulai";
type Filter = { id: string; field: string; op: FilterOp; value: string };

function cellText<T>(columns: GridColumn<T>[], row: T) {
  return columns.map((column) => column.value(row)).join(" ").toLowerCase();
}

function matchFilter<T>(row: T, filter: Filter, columns: GridColumn<T>[]) {
  const column = columns.find((item) => item.key === filter.field);
  if (!column || !filter.value.trim()) return true;
  const hay = column.value(row).toLowerCase();
  const needle = filter.value.trim().toLowerCase();
  if (filter.op === "sama") return hay === needle;
  if (filter.op === "mulai") return hay.startsWith(needle);
  return hay.includes(needle);
}

export function exportExcel(filename: string, headers: string[], rows: string[][]) {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const head = headers.map((header) => `<th>${escape(header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  link.click();
  URL.revokeObjectURL(url);
}

export function StatusPill({ value }: { value: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: statusColor(value), color: "#fff", borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>
      {statusText(value)}
    </span>
  );
}

export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  filename,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  filename: string;
}) {
  const [terms, setTerms] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const needles = terms.toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((row) => {
      const text = cellText(columns, row);
      if (needles.some((needle) => !text.includes(needle))) return false;
      return filters.every((filter) => matchFilter(row, filter, columns));
    });
  }, [rows, terms, filters, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  function addFilter() {
    setFilters((prev) => [...prev, { id: crypto.randomUUID(), field: columns[0]?.key ?? "", op: "berisi", value: "" }]);
    setPage(1);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <input
          value={terms}
          onChange={(event) => {
            setTerms(event.target.value);
            setPage(1);
          }}
          placeholder="Cari beberapa kata, contoh: bca pending"
          style={input}
        />
        <button type="button" onClick={addFilter} style={ghostBtn}>Filter lanjutan</button>
        <button
          type="button"
          onClick={() =>
            exportExcel(
              filename,
              ["No", ...columns.map((column) => column.label)],
              filtered.map((row, index) => [String(index + 1), ...columns.map((column) => column.value(row))]),
            )
          }
          style={primaryBtn}
        >
          Ekspor Excel
        </button>
        <span style={{ color: "#64748b", fontSize: "0.82rem" }}>{filtered.length} baris</span>
      </div>
      {filters.length ? (
        <div style={{ display: "grid", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
          {filters.map((filter) => (
            <div key={filter.id} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <select
                value={filter.field}
                onChange={(event) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, field: event.target.value } : item))}
                style={input}
              >
                {columns.map((column) => (
                  <option key={column.key} value={column.key}>{column.label}</option>
                ))}
              </select>
              <select
                value={filter.op}
                onChange={(event) => setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, op: event.target.value as FilterOp } : item))}
                style={input}
              >
                <option value="berisi">berisi</option>
                <option value="sama">sama dengan</option>
                <option value="mulai">diawali</option>
              </select>
              <input
                value={filter.value}
                onChange={(event) => {
                  const value = event.target.value;
                  setFilters((prev) => prev.map((item) => item.id === filter.id ? { ...item, value } : item));
                  setPage(1);
                }}
                placeholder="Nilai"
                style={input}
              />
              <button type="button" onClick={() => setFilters((prev) => prev.filter((item) => item.id !== filter.id))} style={ghostBtn}>Hapus</button>
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
        <div className="panel-as-cards" style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr>
              <th style={th}>No</th>
              {columns.map((column) => (
                <th key={column.key} style={th}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, index) => (
              <tr key={rowKey(row)} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td data-label="No" style={td}>{(current - 1) * pageSize + index + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.label} style={td}>{column.render ? column.render(row) : column.value(row) || "—"}</td>
                ))}
              </tr>
            ))}
            {!slice.length ? (
              <tr>
                <td data-label="" style={td} colSpan={columns.length + 1}>
                  {terms.trim() || filters.some((filter) => filter.value.trim()) ? "Tidak ada data yang cocok." : "Belum ada data."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "10px 12px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
          <span style={{ color: "#64748b" }}>{filtered.length} baris · halaman {current}/{pages}</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <PagerButton disabled={current <= 1} onClick={() => setPage(1)}>First</PagerButton>
            <PagerButton disabled={current <= 1} onClick={() => setPage(current - 1)}>Prev</PagerButton>
            {pageNumbers(current, pages).map((item, index) =>
              item === "…" ? (
                <span key={`gap-${index}`} style={{ minWidth: 28, textAlign: "center", lineHeight: "32px", color: "#64748b" }}>…</span>
              ) : (
                <PagerButton key={item} active={item === current} onClick={() => setPage(item)}>{item}</PagerButton>
              ),
            )}
            <PagerButton disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</PagerButton>
            <PagerButton disabled={current >= pages} onClick={() => setPage(pages)}>Last</PagerButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function pageNumbers(current: number, pages: number): Array<number | "…"> {
  const shown = new Set<number>([1, pages, current - 1, current, current + 1]);
  const ordered = [...shown].filter((page) => page >= 1 && page <= pages).sort((a, b) => a - b);
  const items: Array<number | "…"> = [];
  for (const page of ordered) {
    const previous = items.at(-1);
    if (typeof previous === "number" && page - previous > 1) items.push("…");
    items.push(page);
  }
  return items;
}

function PagerButton({
  children,
  disabled,
  active,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        minWidth: 32,
        height: 32,
        padding: "0 8px",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
        background: active ? "#059669" : "#fff",
        color: active ? "#fff" : "#0f172a",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", background: "#059669", color: "#fff", fontWeight: 700, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px", verticalAlign: "top" };
const input: React.CSSProperties = { height: 36, border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 10px", background: "#fff", minWidth: 160 };
const ghostBtn: React.CSSProperties = { height: 36, borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", padding: "0 14px", fontWeight: 700, cursor: "pointer" };
const primaryBtn: React.CSSProperties = { height: 36, borderRadius: 999, border: "none", background: "#059669", color: "#fff", padding: "0 14px", fontWeight: 700, cursor: "pointer" };
