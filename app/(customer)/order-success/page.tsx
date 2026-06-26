import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 md:py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        Order Placed!
      </h1>
      {orderId && (
        <p className="text-gray-500 text-sm mb-2">
          Order ID: <span className="text-blue-600 font-mono font-semibold">{orderId}</span>
        </p>
      )}
      <p className="text-gray-600 leading-relaxed mb-8">
        Thank you for your order! Our team will review and confirm it shortly. You&apos;ll receive a confirmation email once it&apos;s been approved.
      </p>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 mb-8 text-left">
        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="text-blue-600 font-bold">What happens next?</span><br />
          Our admin will review your order and send you a confirmation email. If you have any questions, please contact us.
        </p>
      </div>
      <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
        <Link href="/">Back to Menu</Link>
      </Button>
    </div>
  );
}
