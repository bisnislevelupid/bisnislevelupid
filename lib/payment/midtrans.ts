import { createHash, timingSafeEqual } from "node:crypto";

function baseUrl() {
  const prod = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return prod ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
}

export function snapScriptUrl() {
  const prod = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return prod
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export async function createGopaySnap(input: {
  invoice: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
}) {
  const endpoint = `${baseUrl()}/snap/v1/transactions`;
  const body = {
    transaction_details: { order_id: input.invoice, gross_amount: input.amount },
    customer_details: {
      first_name: input.name,
      email: input.email,
      phone: input.phone,
    },
    enabled_payments: ["gopay"],
    item_details: [
      { id: "audit", price: input.amount, quantity: 1, name: "BisnisLevelUp.id" },
    ],
  };
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY missing");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });
  const response = (await res.json()) as { token?: string; redirect_url?: string };
  return { endpoint, httpStatus: res.status, request: body, response, token: response.token };
}

export function verifyMidtransSignature(input: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}) {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) return false;
  const expected = createHash("sha512")
    .update(input.orderId + input.statusCode + input.grossAmount + key)
    .digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(input.signatureKey);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
