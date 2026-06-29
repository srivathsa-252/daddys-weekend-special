"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const checkoutSchema = z.object({
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z
    .string()
    .regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number"),
});
type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ── Order Summary ────────────────────────────────────────────────────────────
function OrderSummary({
  items,
  total,
}: {
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
}) {
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 sticky top-24">
      <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900 mb-5">
        Order Summary
      </h2>
      <div className="space-y-3 mb-5">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.name}{" "}
              <span className="text-gray-400">×{item.quantity}</span>
            </span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 pt-4 flex justify-between font-bold">
        <span className="text-gray-900">Total</span>
        <span className="text-blue-600 text-lg">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

// ── Payment form — must be inside <Elements> to use Stripe hooks ─────────────
function PaymentForm({
  orderId,
  total,
  clearCart,
  onBack,
}: {
  orderId: string;
  total: number;
  clearCart: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Fallback return_url for redirect-based methods (3DS, bank redirects)
        return_url: `${window.location.origin}/order-success?orderId=${orderId}&via=redirect`,
      },
      redirect: "if_required",
    });

    if (error) {
      // Card declined, insufficient funds, etc.
      setPayError(error.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      clearCart();
      router.push(`/order-success?orderId=${orderId}`);
      return;
    }

    // Requires action (e.g. 3DS) — Stripe redirected above; should not reach here
    setPayError("Something unexpected happened. Please check your order status.");
    setPaying(false);
  }

  return (
    <form
      onSubmit={handlePay}
      className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900">
          Payment
        </h2>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Lock className="w-3 h-3" /> Secured by Stripe
        </span>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {payError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
          {payError}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={paying}
          className="flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          disabled={!stripe || !elements || paying}
        >
          {paying ? "Processing…" : `Pay ${formatCurrency(total)}`}
        </Button>
      </div>
    </form>
  );
}

// ── Main checkout page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState<"details" | "payment">("details");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({ resolver: zodResolver(checkoutSchema) });

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl text-gray-900 mb-4">
          Your cart is empty
        </h2>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        >
          <Link href="/">Browse Menu</Link>
        </Button>
      </div>
    );
  }

  async function onDetailsSubmit(data: CheckoutFormData) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          typeof json.error === "string"
            ? json.error
            : "Something went wrong. Please try again.";
        setError(msg);
        return;
      }
      setClientSecret(json.clientSecret);
      setOrderId(json.orderId);
      setStep("payment");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 md:mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">
        Checkout
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step === "details"
              ? "bg-blue-600 text-white"
              : "bg-emerald-500 text-white"
          }`}
        >
          {step === "details" ? "1" : "✓"}
        </span>
        <span
          className={`text-sm font-medium ${
            step === "details" ? "text-gray-900" : "text-gray-400"
          }`}
        >
          Your Details
        </span>
        <span className="w-8 h-px bg-gray-200 mx-1" />
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step === "payment"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          2
        </span>
        <span
          className={`text-sm font-medium ${
            step === "payment" ? "text-gray-900" : "text-gray-400"
          }`}
        >
          Payment
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left: step-dependent form */}
        <div className="lg:col-span-3">
          {step === "details" && (
            <form
              onSubmit={handleSubmit(onDetailsSubmit)}
              className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5"
            >
              <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Your Details
              </h2>
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Smith"
                  {...register("customerName")}
                />
                {errors.customerName && (
                  <p className="text-red-500 text-xs">
                    {errors.customerName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="john@example.com"
                  {...register("customerEmail")}
                />
                {errors.customerEmail && (
                  <p className="text-red-500 text-xs">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  placeholder="+44 7700 900000"
                  {...register("customerPhone")}
                />
                {errors.customerPhone && (
                  <p className="text-red-500 text-xs">
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                disabled={loading}
              >
                {loading ? "Preparing payment…" : "Continue to Payment →"}
              </Button>
            </form>
          )}

          {step === "payment" && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#2563EB",
                    borderRadius: "8px",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
                  },
                },
              }}
            >
              <PaymentForm
                orderId={orderId}
                total={total}
                clearCart={clearCart}
                onBack={() => setStep("details")}
              />
            </Elements>
          )}
        </div>

        {/* Right: order summary (always visible) */}
        <div className="lg:col-span-2">
          <OrderSummary items={items} total={total} />
        </div>
      </div>
    </div>
  );
}
