import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    realm?: "peserta" | "superadmin";
    role?: string;
  }
}
