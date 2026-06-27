import Link from "next/link";
import { CheckCircle, Clock, Mail, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        {/* Icon + heading */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
              Order Placed!
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              We've received your order and will confirm it shortly.
            </p>
          </div>
        </div>

        {/* Order ID */}
        {orderId && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-xs text-blue-400 uppercase tracking-widest mb-1 font-medium">
              Your Order ID
            </p>
            <p className="text-blue-700 font-mono font-bold text-base break-all leading-relaxed">
              {orderId}
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">What happens next?</p>
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                text: "Our team will review your order and send you a confirmation email.",
              },
              {
                icon: Mail,
                text: "You'll receive email updates as your order progresses through each stage.",
              },
              {
                icon: ShoppingBag,
                text: "Your food will be prepared and delivered right to your door.",
              },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Button
          asChild
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          <Link href="/">Back to Menu</Link>
        </Button>
      </div>
    </div>
  );
}
