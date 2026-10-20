import { notFound } from "next/navigation";
import { getOrderPublic } from "@/lib/checkout";
import { snapScriptUrl } from "@/lib/payment/midtrans";
import { Navbar } from "@/components/landing/navbar";
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
      <Navbar />
      <PayView
        initial={order}
        clientKey={process.env.MIDTRANS_CLIENT_KEY ?? ""}
        snapSrc={snapScriptUrl()}
      />
    </>
  );
}
