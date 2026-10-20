const BASE = "https://api.xendit.co";

function authHeader() {
  const key = process.env.XENDIT_API_KEY;
  if (!key) throw new Error("XENDIT_API_KEY missing");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export type XenditCall = {
  endpoint: string;
  httpStatus: number;
  request: unknown;
  response: Record<string, unknown>;
};

export async function createXenditPayment(input: {
  invoice: string;
  amount: number;
  code: string;
  type: string;
  customerName: string;
  phone: string;
  returnUrl: string;
}): Promise<XenditCall & { va?: string; qr?: string; payCode?: string; redirect?: string; ref?: string }> {
  const phone = input.phone.startsWith("+")
    ? input.phone
    : `+${input.phone.replace(/^0/, "62")}`;
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const method: Record<string, unknown> = { reusability: "ONE_TIME_USE" };

  if (input.code === "QR_CODE" || input.type === "qr_code") {
    method.type = "QR_CODE";
    method.qr_code = { channel_code: "QRIS" };
  } else if (input.type === "va") {
    method.type = "VIRTUAL_ACCOUNT";
    method.virtual_account = {
      channel_code: input.code,
      channel_properties: { customer_name: input.customerName, expires_at: expires },
    };
  } else if (input.type === "retail_outlet") {
    method.type = "OVER_THE_COUNTER";
    method.over_the_counter = {
      channel_code: input.code,
      channel_properties: { customer_name: input.customerName, expires_at: expires },
    };
  } else {
    method.type = "EWALLET";
    method.ewallet = {
      channel_code: input.code,
      channel_properties: {
        success_return_url: input.returnUrl,
        failure_return_url: input.returnUrl,
        mobile_number: phone,
      },
    };
  }

  const body = {
    reference_id: input.invoice,
    currency: "IDR",
    amount: input.amount,
    payment_method: method,
  };
  const endpoint = `${BASE}/payment_requests`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const response = (await res.json()) as Record<string, unknown>;
  const pm = (response.payment_method ?? {}) as Record<string, unknown>;
  const va = pm.virtual_account as { channel_properties?: { virtual_account_number?: string } } | undefined;
  const qr = pm.qr_code as { channel_properties?: { qr_string?: string } } | undefined;
  const otc = pm.over_the_counter as { channel_properties?: { payment_code?: string } } | undefined;
  const actions = (response.actions ?? []) as Array<{ action?: string; url?: string; qr_code?: string }>;
  const redirect =
    actions.find((a) => a.url && (a.action === "AUTH" || a.action?.includes("REDIRECT") || a.url))?.url ??
    actions.find((a) => a.url)?.url;
  const qrString = qr?.channel_properties?.qr_string ?? actions.find((a) => a.qr_code)?.qr_code;

  return {
    endpoint,
    httpStatus: res.status,
    request: body,
    response,
    va: va?.channel_properties?.virtual_account_number,
    qr: qrString,
    payCode: otc?.channel_properties?.payment_code,
    redirect,
    ref: typeof response.id === "string" ? response.id : undefined,
  };
}

export function verifyXenditToken(token: string | null) {
  const expected = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;
  return Boolean(expected && token && token === expected);
}
