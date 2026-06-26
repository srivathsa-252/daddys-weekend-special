"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type OrderStatus = "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem?: { name: string };
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
  items: OrderItem[];
}

const STATUS_TABS: OrderStatus[] = ["ALL", "PENDING", "CONFIRMED", "CANCELLED"];

function paymentBadgeVariant(ps: Order["paymentStatus"]) {
  if (ps === "PAID") return "success";
  if (ps === "FAILED" || ps === "REFUNDED") return "destructive";
  return "warning";
}

function orderBadgeVariant(status: Order["status"]) {
  if (status === "CONFIRMED") return "success";
  if (status === "CANCELLED") return "destructive";
  return "warning";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus>("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  async function handleAction(orderId: string, action: "CONFIRM" | "CANCEL") {
    setActionLoading(orderId + action);
    const res = await fetch(`/api/admin/orders?id=${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setActionLoading(null);

    if (res.ok) {
      toast.success(action === "CONFIRM" ? "Order confirmed & email sent" : "Order cancelled");
      fetchOrders();
    } else {
      toast.error(json.error ?? "Action failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
          <p className="text-white/40 text-sm mt-1">{orders.length} orders found</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-[#0F1B3D] border border-white/5 rounded-lg p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === tab
                  ? "bg-gold-DEFAULT text-navy-900"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#0F1B3D] rounded-xl shimmer-bg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-white/30">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-0">
                {/* Order row */}
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/2 transition-colors rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-white font-semibold text-sm">{order.customerName}</p>
                      <Badge variant={orderBadgeVariant(order.status)}>{order.status}</Badge>
                      <Badge variant={paymentBadgeVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                    </div>
                    <p className="text-white/40 text-xs mt-1">{order.customerEmail} · {order.customerPhone} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-gold-DEFAULT font-bold">{formatCurrency(Number(order.total))}</span>
                    {expanded === order.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === order.id && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Order ID</p>
                      <p className="text-white font-mono text-sm">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Items</p>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-white/70">{item.menuItem?.name ?? "Item"} × {item.quantity}</span>
                            <span className="text-white">{formatCurrency(Number(item.price) * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2 mt-2">
                          <span className="text-white">Total</span>
                          <span className="text-gold-DEFAULT">{formatCurrency(Number(order.total))}</span>
                        </div>
                      </div>
                    </div>

                    {order.status === "PENDING" && (
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleAction(order.id, "CONFIRM")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === order.id + "CONFIRM" ? "Confirming..." : "Confirm Order"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(order.id, "CANCEL")}
                          disabled={!!actionLoading}
                          className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                        >
                          {actionLoading === order.id + "CANCEL" ? "Cancelling..." : "Cancel Order"}
                        </Button>
                      </div>
                    )}
                    {order.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(order.id, "CANCEL")}
                        disabled={!!actionLoading}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                      >
                        {actionLoading === order.id + "CANCEL" ? "Cancelling..." : "Cancel & Refund"}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
