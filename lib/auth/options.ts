import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { decode, encode } from "next-auth/jwt";
import { withPool } from "@/lib/db";

export type AuthRealm = "peserta" | "superadmin";

const DAY = 24 * 60 * 60;

export function sessionCookie(realm: AuthRealm) {
  return realm === "superadmin" ? "blu.superadmin.session-token" : "blu.peserta.session-token";
}

export function intentCookie() {
  return "blu.auth.intent";
}

function secureCookie() {
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
}

export function buildAuthOptions(realm: AuthRealm): AuthOptions {
  const secure = secureCookie();
  const prefix = secure ? "__Secure-" : "";
  const oauthCookie = { httpOnly: true, sameSite: "lax" as const, path: "/", secure };
  const salt = sessionCookie(realm);
  return {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt", maxAge: 30 * DAY },
    useSecureCookies: secure,
    jwt: {
      async encode(params) {
        return encode({ ...params, salt });
      },
      async decode(params) {
        return decode({ ...params, salt });
      },
    },
    pages: {
      signIn: realm === "superadmin" ? "/masuk-admin" : "/masuk",
      error: realm === "superadmin" ? "/masuk-admin" : "/masuk",
    },
    cookies: {
      sessionToken: {
        name: salt,
        options: { httpOnly: true, sameSite: "lax", path: "/", secure },
      },
      callbackUrl: {
        name: `${prefix}next-auth.callback-url`,
        options: oauthCookie,
      },
      pkceCodeVerifier: {
        name: `${prefix}next-auth.pkce.code_verifier`,
        options: { ...oauthCookie, maxAge: 60 * 15 },
      },
      state: {
        name: `${prefix}next-auth.state`,
        options: { ...oauthCookie, maxAge: 60 * 15 },
      },
      nonce: {
        name: `${prefix}next-auth.nonce`,
        options: oauthCookie,
      },
    },
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      }),
    ],
    callbacks: {
      async signIn({ user }) {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;
        if (realm === "superadmin") {
          const admin = await withPool(async (pool) => {
            const { rows } = await pool.query(
              `SELECT id::text, role, status FROM admins WHERE lower(email) = $1`,
              [email],
            );
            return rows[0] as { id: string; role: string; status: string } | undefined;
          });
          if (!admin || admin.role !== "SUPERADMIN" || admin.status !== "ACTIVE") return false;
          await withPool((pool) =>
            pool.query(`UPDATE admins SET last_login_at = NOW(), updated_at = NOW() WHERE id::text = $1`, [admin.id]),
          );
          user.id = admin.id;
          return true;
        }
        const customer = await withPool(async (pool) => {
          const existing = await pool.query(
            `SELECT id::text, deleted_at, status FROM customers WHERE lower(email) = $1`,
            [email],
          );
          const row = existing.rows[0] as { id: string; deleted_at: string | null; status: string } | undefined;
          if (row?.deleted_at || (row && row.status !== "ACTIVE")) return null;
          if (row) {
            await pool.query(
              `UPDATE customers
               SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
               WHERE id::text = $1`,
              [row.id],
            );
            return row.id;
          }
          const inserted = await pool.query(
            `INSERT INTO customers (name, email, email_verified_at, status)
             VALUES ($1, $2, NOW(), 'ACTIVE')
             RETURNING id::text`,
            [user.name?.trim() || email, email],
          );
          return inserted.rows[0].id as string;
        });
        if (!customer) return false;
        user.id = customer;
        return true;
      },
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
          if (user.image) token.picture = user.image;
          token.realm = realm;
          token.role = realm === "superadmin" ? "SUPERADMIN" : "PESERTA";
        }
        return token;
      },
      async session({ session, token }) {
        session.user = session.user ?? {};
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        return session;
      },
    },
  };
}
