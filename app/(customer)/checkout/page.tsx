"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { PaymentForm } from "@/components/payment-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, "Invalid phone number"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
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
        <h2 className="font-display text-2xl text-gray-900 mb-4">Your cart is empty</h2>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Link href="/">Browse Menu</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(data: CheckoutFormData) {
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
        setError(json.error || "Something went wrong");
        return;
      }
      setClientSecret(json.clientSecret);
      setOrderId(json.orderId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <Link href="/cart" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 md:mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left: Form + Payment */}
        <div className="lg:col-span-3 space-y-6">
          {!clientSecret ? (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5">
              <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900 mb-2">Your Details</h2>
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input id="customerName" placeholder="John Smith" {...register("customerName")} />
                {errors.customerName && <p className="text-red-500 text-xs">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email Address</Label>
                <Input id="customerEmail" type="email" placeholder="john@example.com" {...register("customerEmail")} />
                {errors.customerEmail && <p className="text-red-500 text-xs">{errors.customerEmail.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input id="customerPhone" placeholder="+44 7700 900000" {...register("customerPhone")} />
                {errors.customerPhone && <p className="text-red-500 text-xs">{errors.customerPhone.message}</p>}
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
              )}
              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md" disabled={loading}>
                {loading ? "Processing..." : "Continue to Payment"}
              </Button>
            </form>
          ) : (
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
              <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900 mb-5">Payment</h2>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#2563EB",
                      colorBackground: "#FFFFFF",
                      colorText: "#111827",
                      colorDanger: "#ef4444",
                      fontFamily: "system-ui, sans-serif",
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <PaymentForm
                  orderId={orderId!}
                  clientSecret={clientSecret}
                  onSuccess={() => {
                    clearCart();
                    router.push(`/order-success?orderId=${orderId}`);
                  }}
                />
              </Elements>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 sticky top-24">
            <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900 mb-5">Order Summary</h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <span className="text-gray-900 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-blue-600 text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
