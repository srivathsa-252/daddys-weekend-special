"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z
    .string()
    .regex(/^[\d\s]+$/, "Digits only — the +44 is already added")
    .refine((v) => {
      const digits = v.replace(/\D/g, "").replace(/^0/, "");
      return digits.length === 9 || digits.length === 10;
    }, "Enter a valid UK number, e.g. 7700 900000"),
  addressLine1: z.string().min(3, "Address line 1 is required").max(200),
  city: z.string().min(2, "City is required").max(100),
  postcode: z.string().regex(/^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i, "Enter a valid UK postcode"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { items } = useCart();

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

  return <CheckoutFlow />;
}

function CheckoutFlow() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState<"info" | "payment">("info");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormData>({ resolver: zodResolver(checkoutSchema) });

  async function onInfoSubmit(data: CheckoutFormData) {
    setLoading(true);
    setError(null);
    try {
      const ukPhone = "+44 " + data.customerPhone.replace(/\D/g, "").replace(/^0/, "");
      const res = await fetch("/api/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          customerPhone: ukPhone,
          items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Something went wrong. Please try again.");
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
      <Link href="/cart" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 md:mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-3">
          {step === "info" && (
            <form onSubmit={handleSubmit(onInfoSubmit)} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-5">
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
                <Label htmlFor="customerPhone">Phone Number (UK)</Label>
                <div className="flex items-stretch rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-600/30 focus-within:border-blue-600 transition-colors overflow-hidden">
                  <span className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-gray-500 text-sm font-medium select-none">
                    +44
                  </span>
                  <input
                    id="customerPhone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="7700 900000"
                    className="flex-1 min-w-0 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                    {...register("customerPhone")}
                  />
                </div>
                {errors.customerPhone && <p className="text-red-500 text-xs">{errors.customerPhone.message}</p>}
              </div>

              <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900 pt-2">Delivery Address</h2>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input id="addressLine1" placeholder="123 High Street" {...register("addressLine1")} />
                {errors.addressLine1 && <p className="text-red-500 text-xs">{errors.addressLine1.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Birmingham" {...register("city")} />
                {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" placeholder="B1 1AA" {...register("postcode")} />
                {errors.postcode && <p className="text-red-500 text-xs">{errors.postcode.message}</p>}
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
              )}
              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md" disabled={loading}>
                {loading ? "Preparing payment..." : "Continue to Payment"}
              </Button>
            </form>
          )}

          {step === "payment" && clientSecret && orderId && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: "stripe" } }}
            >
              <PaymentStep
                orderId={orderId}
                total={total}
                customerName={getValues("customerName")}
                customerEmail={getValues("customerEmail")}
                postcode={getValues("postcode")}
                onBack={() => setStep("info")}
                onSuccess={() => {
                  clearCart();
                  router.push(`/order-success?orderId=${orderId}`);
                }}
              />
            </Elements>
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

function PaymentStep({
  orderId,
  total,
  customerName,
  customerEmail,
  postcode,
  onBack,
  onSuccess,
}: {
  orderId: string;
  total: number;
  customerName: string;
  customerEmail: string;
  postcode: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function onPay() {
    if (!stripe || !elements) return;

    setPaying(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success?orderId=${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message ?? "Payment failed. Please try again.");
      setPaying(false);
      return;
    }

    onSuccess();
  }

  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg md:text-xl font-semibold text-gray-900">Payment</h2>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Edit details
        </button>
      </div>

      <div>
        <PaymentElement
          options={{
            defaultValues: {
              billingDetails: {
                name: customerName,
                email: customerEmail,
                address: { postal_code: postcode, country: "GB" },
              },
            },
          }}
        />
        {paymentError && (
          <p className="text-red-500 text-xs mt-2">{paymentError}</p>
        )}
      </div>

      <Button
        onClick={onPay}
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
        disabled={paying || !stripe}
      >
        {paying ? (
          "Processing..."
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Pay {formatCurrency(total)}
          </span>
        )}
      </Button>
      <p className="text-xs text-gray-400 text-center">Secured by Stripe. Your card details are never stored on our servers.</p>
    </div>
  );
}
