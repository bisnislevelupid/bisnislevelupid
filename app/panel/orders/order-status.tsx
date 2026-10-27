"use client";

import { useState } from "react";
import { statusText } from "@/lib/admin/format";
import { MarkPaidButton } from "./mark-paid";
import { RejectOrderButton } from "./reject-order";

function statusTone(status: string) {
  if (status === "PAID") return { bg: "#059669", label: statusText(status) };
  if (status === "PENDING") return { bg: "#d97706", label: "Menunggu pembayaran" };
  if (status === "EXPIRED") return { bg: "#64748b", label: statusText(status) };
  if (status === "CANCELLED") return { bg: "#b91c1c", label: statusText(status) };
  return { bg: "#0369a1", label: statusText(status) };
}

export function OrderHeadline({
  status,
  orderId,
  invoice,
  manualTransfer,
}: {
  status: string;
  orderId: string;
  invoice: string;
  manualTransfer: boolean;
}) {
  const [override, setOverride] = useState<string | null>(null);
  const current = override ?? status;
  const tone = statusTone(current);
  const closed = current === "PAID" || current === "CANCELLED";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
      <div>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>Invoice</p>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, margin: "2px 0 8px" }}>{invoice}</h1>
        <span style={{ background: tone.bg, color: "#fff", borderRadius: 999, padding: "4px 12px", fontWeight: 700, fontSize: "0.8rem" }}>{tone.label}</span>
      </div>
      {closed ? null : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <MarkPaidButton orderId={orderId} invoice={invoice} onDone={() => setOverride("PAID")} />
          {manualTransfer ? <RejectOrderButton orderId={orderId} invoice={invoice} onDone={() => setOverride("CANCELLED")} /> : null}
        </div>
      )}
    </div>
  );
}
