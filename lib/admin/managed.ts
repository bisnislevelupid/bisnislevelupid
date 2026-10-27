import { randomBytes } from "node:crypto";
import { withPool } from "@/lib/db";
import { NOTIFICATION_EVENTS } from "@/lib/admin/labels";
import { getNotificationLogDetail } from "@/lib/db/notification-logs";
import { getPaymentLogDetail } from "@/lib/db/payment-logs";

const ROLES = new Set(["SUPERADMIN", "ADMIN", "FINANCE", "CONTENT", "SUPPORT"]);
const STATUSES = new Set(["ACTIVE", "INACTIVE"]);

export type AdminInput = {
  name: string;
  email: string;
  role: string;
  status: string;
};

export type InstructionInput = {
  id?: string;
  title: string;
  content: string;
  sortOrder: number;
};

export type MethodInput = {
  code: string;
  name: string;
  logoUrl: string;
  type: string;
  provider: string;
  adminFeeFlat: number;
  adminFeePct: number;
  isActive: boolean;
  isRedirect: boolean;
  sortOrder: number;
  accountNumber: string;
  accountHolder: string;
  instructions: InstructionInput[];
};

export type TemplateInput = {
  eventTrigger: string;
  channel: string;
  subject: string;
  messageContent: string;
  isActive: boolean;
};

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function listAdmins() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, name, email, role, status, last_login_at, created_at
       FROM admins ORDER BY id DESC`,
    );
    return rows;
  });
}

export async function getAdmin(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT name, email, role, status FROM admins WHERE id::text = $1`,
      [id],
    );
    return (rows[0] as { name: string; email: string; role: string; status: string } | undefined) ?? null;
  });
}

export async function saveAdmin(input: AdminInput, id?: string) {
  if (!ROLES.has(input.role)) throw new Error("Role tidak dikenal");
  if (!STATUSES.has(input.status)) throw new Error("Status tidak dikenal");
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (name.length < 2 || !email.includes("@")) throw new Error("Nama atau email tidak valid");
  return withPool(async (pool) => {
    if (!id) {
      const { rows } = await pool.query(
        `INSERT INTO admins (name, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id::text`,
        [name, email, `google-sso:${randomBytes(24).toString("hex")}`, input.role, input.status],
      );
      return rows[0].id as string;
    }
    const { rows } = await pool.query(
      `UPDATE admins SET name=$1, email=$2, role=$3, status=$4, updated_at=NOW()
       WHERE id::text=$5 RETURNING id::text`,
      [name, email, input.role, input.status, id],
    );
    if (!rows[0]) throw new Error("Pengguna tidak ditemukan");
    return rows[0].id as string;
  });
}

export async function reorderMethods(ids: string[]) {
  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const [index, id] of ids.entries()) {
        await client.query(`UPDATE payment_methods SET sort_order = $1 WHERE id::text = $2`, [index, id]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}

export async function listMethods() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT m.id::text, m.code, m.name, m.type, m.provider, m.is_active, m.sort_order,
              (SELECT count(*)::int FROM payment_instructions i WHERE i.payment_method_id = m.id) AS instruction_count
       FROM payment_methods m
       ORDER BY m.sort_order, m.id`,
    );
    return rows;
  });
}

export async function getMethod(id: string) {
  return withPool(async (pool) => {
    const method = await pool.query(
      `SELECT id::text, code, name, logo_url, type, provider, admin_fee_flat::text, admin_fee_pct::text,
              is_active, is_redirect, sort_order, account_number, account_holder
       FROM payment_methods WHERE id::text = $1`,
      [id],
    );
    if (!method.rows[0]) return null;
    const steps = await pool.query(
      `SELECT id::text, title, content, sort_order
       FROM payment_instructions WHERE payment_method_id::text = $1 ORDER BY sort_order, id`,
      [id],
    );
    return { method: method.rows[0], instructions: steps.rows };
  });
}

export async function saveMethod(input: MethodInput, id?: string) {
  if (!input.code.trim() || !input.name.trim()) throw new Error("Kode dan nama wajib diisi");
  return withPool(async (pool) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const values = [
        input.code.trim(),
        input.name.trim(),
        clean(input.logoUrl),
        input.type.trim(),
        input.provider.trim(),
        input.adminFeeFlat,
        input.adminFeePct,
        input.isActive,
        input.isRedirect,
        input.sortOrder,
        clean(input.accountNumber),
        clean(input.accountHolder),
      ];
      const saved = id
        ? await client.query(
            `UPDATE payment_methods SET
              code=$1, name=$2, logo_url=$3, type=$4, provider=$5,
              admin_fee_flat=$6, admin_fee_pct=$7, is_active=$8, is_redirect=$9,
              sort_order=$10, account_number=$11, account_holder=$12
             WHERE id::text=$13 RETURNING id`,
            [...values, id],
          )
        : await client.query(
            `INSERT INTO payment_methods (
              code, name, logo_url, type, provider, admin_fee_flat, admin_fee_pct,
              is_active, is_redirect, sort_order, account_number, account_holder
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            values,
          );
      const methodId = saved.rows[0]?.id as string | undefined;
      if (!methodId) throw new Error("Metode tidak ditemukan");
      const keep = input.instructions.map((step) => step.id).filter((stepId): stepId is string => Boolean(stepId));
      if (keep.length) {
        await client.query(
          `DELETE FROM payment_instructions WHERE payment_method_id = $1 AND id::text <> ALL($2::text[])`,
          [methodId, keep],
        );
      } else {
        await client.query(`DELETE FROM payment_instructions WHERE payment_method_id = $1`, [methodId]);
      }
      for (const [index, step] of input.instructions.entries()) {
        if (!step.title.trim() || !step.content.trim()) throw new Error("Judul dan isi instruksi wajib diisi");
        if (step.id) {
          await client.query(
            `UPDATE payment_instructions SET title=$1, content=$2, sort_order=$3
             WHERE id::text=$4 AND payment_method_id=$5`,
            [step.title.trim(), step.content.trim(), index, step.id, methodId],
          );
        } else {
          await client.query(
            `INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
             VALUES ($1,$2,$3,$4)`,
            [methodId, step.title.trim(), step.content.trim(), index],
          );
        }
      }
      await client.query("COMMIT");
      return String(methodId);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });
}

export async function listPaymentLogs() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, invoice_code, endpoint, type, http_status, created_at
       FROM payment_logs ORDER BY id DESC LIMIT 200`,
    );
    return rows;
  });
}

export async function getPaymentLog(id: string) {
  return getPaymentLogDetail(id);
}

export async function listTemplates() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, event_trigger, channel, subject, is_active, updated_at
       FROM notification_templates ORDER BY event_trigger, channel`,
    );
    return rows;
  });
}

export async function getTemplate(id: string) {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT id::text, event_trigger, channel, subject, message_content, is_active
       FROM notification_templates WHERE id::text = $1`,
      [id],
    );
    return rows[0] ?? null;
  });
}

const TEMPLATE_EVENTS = new Set<string>(NOTIFICATION_EVENTS);

export async function saveTemplate(input: TemplateInput, id?: string) {
  if (!TEMPLATE_EVENTS.has(input.eventTrigger.trim())) throw new Error("Event harus ORDER_CREATED, ORDER_PAID, atau TEST_RESULT");
  if (!input.channel.trim() || !input.messageContent.trim()) {
    throw new Error("Kanal dan isi pesan wajib diisi");
  }
  return withPool(async (pool) => {
    if (!id) {
      const { rows } = await pool.query(
        `INSERT INTO notification_templates (event_trigger, channel, subject, message_content, is_active)
         VALUES ($1,$2,$3,$4,$5) RETURNING id::text`,
        [input.eventTrigger.trim(), input.channel.trim(), clean(input.subject), input.messageContent.trim(), input.isActive],
      );
      return rows[0].id as string;
    }
    const { rows } = await pool.query(
      `UPDATE notification_templates
       SET event_trigger=$1, channel=$2, subject=$3, message_content=$4, is_active=$5, updated_at=NOW()
       WHERE id::text=$6 RETURNING id::text`,
      [input.eventTrigger.trim(), input.channel.trim(), clean(input.subject), input.messageContent.trim(), input.isActive, id],
    );
    if (!rows[0]) throw new Error("Template tidak ditemukan");
    return rows[0].id as string;
  });
}

export async function listNotificationLogs() {
  return withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT l.id::text, l.recipient, l.channel, l.status, l.invoice_code, l.created_at,
              t.event_trigger
       FROM notification_logs l
       LEFT JOIN notification_templates t ON t.id = l.template_id
       ORDER BY l.id DESC LIMIT 200`,
    );
    return rows;
  });
}

export async function getNotificationLog(id: string) {
  return getNotificationLogDetail(id);
}
