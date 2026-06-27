"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

type OrderStatus =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "PARTNER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type Action = "CONFIRM" | "CANCEL" | "ASSIGN_PARTNER" | "OUT_FOR_DELIVERY" | "MARK_DELIVERED";

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
  status: Exclude<OrderStatus, "ALL">;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
  items: OrderItem[];
}

const STATUS_TABS: OrderStatus[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PARTNER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABELS: Record<string, string> = {
  ALL: "All",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PARTNER_ASSIGNED: "Partner Assigned",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const ACTION_MESSAGES: Record<Action, string> = {
  CONFIRM: "Order confirmed & email sent",
  CANCEL: "Order cancelled",
  ASSIGN_PARTNER: "Partner assigned & email sent",
  OUT_FOR_DELIVERY: "Out for delivery — email sent",
  MARK_DELIVERED: "Order marked as delivered",
};

function paymentBadgeVariant(ps: Order["paymentStatus"]): "success" | "destructive" | "warning" {
  if (ps === "PAID") return "success";
  if (ps === "FAILED" || ps === "REFUNDED") return "destructive";
  return "warning";
}

function orderBadgeVariant(
  status: Order["status"]
): "success" | "destructive" | "warning" | "default" | "secondary" {
  if (status === "CONFIRMED" || status === "DELIVERED") return "success";
  if (status === "CANCELLED") return "destructive";
  if (status === "PARTNER_ASSIGNED") return "default";
  if (status === "OUT_FOR_DELIVERY") return "warning";
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

  async function handleAction(orderId: string, action: Action) {
    setActionLoading(orderId + action);
    const res = await fetch(`/api/admin/orders?id=${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    setActionLoading(null);
    if (res.ok) {
      toast.success(ACTION_MESSAGES[action]);
      fetchOrders();
    } else {
      toast.error(json.error ?? "Action failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">{orders.length} orders found</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1 overflow-x-auto flex-shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {STATUS_LABELS[tab]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-0">
                {/* Order row */}
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-gray-900 font-semibold text-sm">{order.customerName}</p>
                      <Badge variant={orderBadgeVariant(order.status)}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                      <Badge variant={paymentBadgeVariant(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {order.customerEmail} · {order.customerPhone} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(Number(order.total))}
                    </span>
                    {expanded === order.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === order.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">
                        Order ID
                      </p>
                      <p className="text-gray-700 font-mono text-sm break-all">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Items</p>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.menuItem?.name ?? "Item"} × {item.quantity}
                            </span>
                            <span className="text-gray-900">
                              {formatCurrency(Number(item.price) * item.quantity)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2 mt-2">
                          <span className="text-gray-900">Total</span>
                          <span className="text-blue-600">
                            {formatCurrency(Number(order.total))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {order.status === "PENDING" && (
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleAction(order.id, "CONFIRM")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === order.id + "CONFIRM" ? "Confirming..." : "Confirm Order"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleAction(order.id, "CANCEL")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === order.id + "CANCEL" ? "Cancelling..." : "Cancel Order"}
                        </Button>
                      </div>
                    )}

                    {order.status === "CONFIRMED" && (
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleAction(order.id, "ASSIGN_PARTNER")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === order.id + "ASSIGN_PARTNER"
                            ? "Assigning..."
                            : "Assign Partner"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleAction(order.id, "CANCEL")}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === order.id + "CANCEL" ? "Cancelling..." : "Cancel Order"}
                        </Button>
                      </div>
                    )}

                    {order.status === "PARTNER_ASSIGNED" && (
                      <Button
                        size="sm"
                        onClick={() => handleAction(order.id, "OUT_FOR_DELIVERY")}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === order.id + "OUT_FOR_DELIVERY"
                          ? "Updating..."
                          : "Mark Out for Delivery"}
                      </Button>
                    )}

                    {order.status === "OUT_FOR_DELIVERY" && (
                      <Button
                        size="sm"
                        onClick={() => handleAction(order.id, "MARK_DELIVERED")}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === order.id + "MARK_DELIVERED"
                          ? "Updating..."
                          : "Mark Delivered"}
                      </Button>
                    )}

                    {order.status === "DELIVERED" && (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Delivered
                      </div>
                    )}

                    {order.status === "CANCELLED" && (
                      <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Cancelled
                      </div>
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
