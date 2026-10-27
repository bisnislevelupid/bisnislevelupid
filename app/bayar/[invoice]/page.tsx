import { notFound } from "next/navigation";
import { getOrderPublic } from "@/lib/checkout";
import { snapScriptUrl } from "@/lib/payment/midtrans";
import { SiteHeader } from "@/components/landing/site-header";
import { PayView } from "./pay-view";
import "../../prototype.css";

export default async function BayarPage({
  params,
}: {
  params: Promise<{ invoice: string }>;
}) {
  const { invoice } = await params;
  const order = await getOrderPublic(invoice);
  if (!order) notFound();
  return (
    <>
      <SiteHeader />
      <PayView
        initial={order}
        clientKey={process.env.MIDTRANS_CLIENT_KEY ?? ""}
        snapSrc={snapScriptUrl()}
      />
    </>
  );
}
