export const dynamic = "force-dynamic";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartClearer } from "@/components/cart-clearer";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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
          <div className="px-6 pb-6">
            <Button
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl h-12 font-semibold"
            >
              <Link href="/">Back to Menu</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
