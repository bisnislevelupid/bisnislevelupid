import { pgTable, bigserial, varchar, text, timestamp } from "drizzle-orm/pg-core";

/** Marker schema for drizzle-kit. Full DDL lives in drizzle/0000_init.sql. */
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const admins = pgTable("admins", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: varchar("email", { length: 150 }).notNull(),
});
