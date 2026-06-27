"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  orderId: string;
  orderNumber: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignPartnerModal({ orderId, orderNumber, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ partnerName: "", partnerPhone: "", estimatedDelivery: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayNumber = `#${String(orderNumber).padStart(4, "0")}`;

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.partnerName.trim() || !form.partnerPhone.trim() || !form.estimatedDelivery.trim()) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/orders?id=${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ASSIGN_PARTNER", ...form }),
    });
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success("Partner assigned & customer notified by email");
      onSuccess();
    } else {
      setError(json.error ?? "Failed to assign partner");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">Assign Delivery Partner</h2>
            <p className="text-gray-400 text-sm mt-0.5">Order {displayNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Partner Name</Label>
            <Input
              placeholder="e.g. Mohammed Ali"
              value={form.partnerName}
              onChange={update("partnerName")}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Partner Phone</Label>
            <Input
              placeholder="e.g. +44 7700 900000"
              value={form.partnerPhone}
              onChange={update("partnerPhone")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Estimated Delivery Time</Label>
            <Input
              placeholder="e.g. 30–45 minutes / 7:30 PM"
              value={form.estimatedDelivery}
              onChange={update("estimatedDelivery")}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Assigning..." : "Assign & Notify Customer"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
