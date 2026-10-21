"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["SUPERADMIN", "ADMIN", "FINANCE", "CONTENT", "SUPPORT"];

export function AdminForm({
  id,
  initial,
}: {
  id?: string;
  initial?: { name: string; email: string; role: string; status: string };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(id ? `/api/panel/managed/admins/${id}` : "/api/panel/managed/admins", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        role: form.get("role"),
        status: form.get("status"),
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal menyimpan");
      return;
    }
    router.push("/panel/pengguna");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <label>Nama<input name="name" required defaultValue={initial?.name} style={field} /></label>
      <label>Email Google<input name="email" type="email" required defaultValue={initial?.email} style={field} /></label>
      <label>
        Role
        <select name="role" defaultValue={initial?.role ?? "SUPERADMIN"} style={field}>
          {ROLES.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select name="status" defaultValue={initial?.status ?? "ACTIVE"} style={field}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </label>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <button disabled={pending} style={button}>{pending ? "Menyimpan..." : "Simpan"}</button>
    </form>
  );
}

const field: CSSProperties = { display: "block", width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" };
const button: CSSProperties = { height: 42, border: "none", borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer" };
