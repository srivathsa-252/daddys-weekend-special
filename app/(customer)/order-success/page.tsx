export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartClearer } from "@/components/cart-clearer";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

// TODO: paste the WhatsApp community invite link here
const WHATSAPP_COMMUNITY_URL = "";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNumber: true, createdAt: true },
      })
    : null;

  const displayNumber = order
    ? `#${String(order.orderNumber).padStart(4, "0")}`
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4 py-8">
      <CartClearer />
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Top green band */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 pt-8 pb-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={2} />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
              Order Placed!
            </h1>
            <p className="text-gray-500 text-sm">
              {order ? formatDate(order.createdAt) : "Just now"}
            </p>
          </div>

          {/* Order number */}
          {displayNumber && (
            <div className="px-6 py-5 border-b border-gray-100 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-medium">
                Your Order Reference
              </p>
              <p className="text-4xl font-bold text-blue-600 font-mono tracking-wide">
                {displayNumber}
              </p>
              <p className="text-gray-300 text-xs font-mono mt-2 break-all">
                {orderId}
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">
              What happens next?
            </p>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  text: "The restaurant reviews your order and sends a confirmation email.",
                },
                {
                  step: "2",
                  text: "A delivery partner is assigned and you'll be notified by email.",
                },
                {
                  step: "3",
                  text: "Your food is prepared and on its way to you!",
                },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6 space-y-3">
            <Button
              asChild
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm rounded-xl h-12 font-semibold"
            >
              <a
                href={WHATSAPP_COMMUNITY_URL || "#"}
                target={WHATSAPP_COMMUNITY_URL ? "_blank" : undefined}
                rel="noopener noreferrer"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join our WhatsApp Community
                </span>
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm rounded-xl h-12 font-semibold"
            >
              <Link href="/">Back to Menu</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
