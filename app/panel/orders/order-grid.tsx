"use client";

import Link from "next/link";
import { statusText } from "@/lib/admin/format";
import { DataGrid, StatusPill, type GridColumn } from "../_components/data-grid";

export type OrderRow = {
  id: string;
  invoice: string;
  buyer: string;
  email: string;
  phone: string;
  product: string;
  method: string;
  status: string;
  total: string;
  created: string;
};

const columns: GridColumn<OrderRow>[] = [
  { key: "invoice", label: "Invoice", value: (row) => row.invoice },
  { key: "buyer", label: "Pembeli", value: (row) => `${row.buyer} ${row.email} ${row.phone}`, render: (row) => (
    <div>
      <div>{row.buyer || "—"}</div>
      <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{row.email}</div>
      <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{row.phone}</div>
    </div>
  ) },
  { key: "product", label: "Produk", value: (row) => row.product },
  { key: "method", label: "Metode", value: (row) => row.method },
  { key: "status", label: "Status", value: (row) => `${row.status} ${statusText(row.status)}`, render: (row) => <StatusPill value={row.status} /> },
  { key: "total", label: "Grand total", value: (row) => row.total },
  { key: "created", label: "Masuk", value: (row) => row.created },
  {
    key: "aksi",
    label: "Aksi",
    value: () => "Detail",
    render: (row) => (
      <Link href={`/panel/orders/${row.id}`} style={{ display: "inline-flex", background: "#059669", color: "#fff", borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: "0.78rem" }}>
        Detail
      </Link>
    ),
  },
];

export function OrderGrid({ rows }: { rows: OrderRow[] }) {
  return <DataGrid columns={columns} rows={rows} rowKey={(row) => row.id} filename="pesanan" />;
}
