"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AssignPartnerModal } from "@/components/admin/assign-partner-modal";

type OrderStatus =
  | "ALL"
  | "PENDING"
  | "CONFIRMED"
  | "PARTNER_ASSIGNED"
  | "DELIVERED"
  | "CANCELLED";

type Action = "CONFIRM" | "CANCEL" | "MARK_DELIVERED";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  menuItem?: { name: string } | null;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  city: string;
  postcode: string;
  total: number;
  status: Exclude<OrderStatus, "ALL">;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  partnerName: string | null;
  partnerPhone: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_TABS: OrderStatus[] = [
  "ALL", "PENDING", "CONFIRMED", "PARTNER_ASSIGNED", "DELIVERED", "CANCELLED",
];

const STATUS_LABELS: Record<string, string> = {
  ALL: "All",
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PARTNER_ASSIGNED: "Partner Assigned",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const ACTION_MESSAGES: Record<Action, string> = {
  CONFIRM: "Order confirmed & email sent",
  CANCEL: "Order cancelled",
  MARK_DELIVERED: "Order marked as delivered — email sent",
};

function displayRef(orderNumber: number) {
  return `#${String(orderNumber).padStart(4, "0")}`;
}

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
  return "warning";
}

// ── Inline pending-action buttons shown directly in each row ──────────────────
function PendingAction({
  order,
  actionLoading,
  onAction,
  onAssign,
}: {
  order: Order;
  actionLoading: string | null;
  onAction: (id: string, action: Action) => void;
  onAssign: (id: string, num: number) => void;
}) {
  if (order.status === "PENDING") {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => onAction(order.id, "CONFIRM")}
          disabled={!!actionLoading}
        >
          {actionLoading === order.id + "CONFIRM" ? "…" : "Accept"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onAction(order.id, "CANCEL")}
          disabled={!!actionLoading}
        >
          {actionLoading === order.id + "CANCEL" ? "…" : "Cancel"}
        </Button>
      </div>
    );
  }
  if (order.status === "CONFIRMED") {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => onAssign(order.id, order.orderNumber)}
          disabled={!!actionLoading}
        >
          Assign Partner
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onAction(order.id, "CANCEL")}
          disabled={!!actionLoading}
        >
          {actionLoading === order.id + "CANCEL" ? "…" : "Cancel"}
        </Button>
      </div>
    );
  }
  if (order.status === "PARTNER_ASSIGNED") {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => onAction(order.id, "MARK_DELIVERED")}
          disabled={!!actionLoading}
        >
          {actionLoading === order.id + "MARK_DELIVERED" ? "…" : "Mark Delivered"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={() => onAction(order.id, "CANCEL")}
          disabled={!!actionLoading}
        >
          {actionLoading === order.id + "CANCEL" ? "…" : "Cancel"}
        </Button>
      </div>
    );
  }
  // DELIVERED or CANCELLED — nothing pending
  return null;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus>("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ id: string; orderNumber: number } | null>(null);

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
    if (action === "CANCEL" && !confirm("Cancel this order? If it has been paid, the customer will be refunded automatically.")) {
      return;
    }
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

  function openAssign(id: string, num: number) {
    setAssignModal({ id, orderNumber: num });
  }

  async function handleDelete(orderId: string) {
    if (!confirm("Permanently delete this order? This removes it from history and cannot be undone. No refund is issued by deleting.")) {
      return;
    }
    setActionLoading(orderId + "DELETE");
    const res = await fetch(`/api/admin/orders?id=${orderId}`, { method: "DELETE" });
    const json = await res.json();
    setActionLoading(null);
    if (res.ok) {
      toast.success("Order deleted");
      setExpanded(null);
      fetchOrders();
    } else {
      toast.error(json.error ?? "Delete failed");
    }
  }

  return (
    <>
      {assignModal && (
        <AssignPartnerModal
          orderId={assignModal.id}
          orderNumber={assignModal.orderNumber}
          onClose={() => setAssignModal(null)}
          onSuccess={() => { setAssignModal(null); fetchOrders(); }}
        />
      )}

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
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="shimmer-bg h-4 w-10 rounded-md" />
                  <div className="shimmer-bg h-4 w-32 rounded-md" />
                  <div className="shimmer-bg h-5 w-20 rounded-full" />
                  <div className="ml-auto shimmer-bg h-7 w-20 rounded-lg" />
                  <div className="shimmer-bg h-4 w-14 rounded-md" />
                </div>
                <div className="shimmer-bg h-3 w-64 rounded-md" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No orders found.</div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-0">

                  {/* ── Collapsed row ─────────────────────────────────────── */}
                  <div className="flex items-center gap-3 p-4 sm:p-5">

                    {/* Ref + customer info — clicking this area toggles expand */}
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <span className="text-blue-600 font-bold font-mono text-sm flex-shrink-0 w-12">
                        {displayRef(order.orderNumber)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-gray-900 font-semibold text-sm">{order.customerName}</p>
                          <Badge variant={orderBadgeVariant(order.status)}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">
                          {order.customerEmail} · {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Pending action — stopPropagation so clicking doesn't expand */}
                    <div
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PendingAction
                        order={order}
                        actionLoading={actionLoading}
                        onAction={handleAction}
                        onAssign={openAssign}
                      />
                    </div>

                    {/* Total + chevron — clicking this toggles expand */}
                    <div
                      className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      <span className="text-blue-600 font-bold text-sm hidden sm:block">
                        {formatCurrency(Number(order.total))}
                      </span>
                      {expanded === order.id
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* ── Expanded detail ────────────────────────────────────── */}
                  {expanded === order.id && (
                    <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Order Ref</p>
                          <p className="text-blue-600 font-bold font-mono text-xl">{displayRef(order.orderNumber)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total</p>
                          <p className="text-gray-900 font-bold">{formatCurrency(Number(order.total))}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Payment</p>
                          <Badge variant={paymentBadgeVariant(order.paymentStatus)}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Contact</p>
                        <p className="text-gray-700 text-sm">{order.customerEmail} · {order.customerPhone}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Delivery Address</p>
                        <p className="text-gray-700 text-sm">{order.addressLine1}, {order.city}, {order.postcode}</p>
                      </div>

                      {/* Partner details if assigned */}
                      {order.partnerName && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
                          <p className="text-blue-600 font-semibold text-xs uppercase tracking-widest mb-2">Delivery Partner</p>
                          <p className="text-gray-700 text-sm"><span className="text-gray-400">Name: </span>{order.partnerName}</p>
                          <p className="text-gray-700 text-sm"><span className="text-gray-400">Phone: </span>{order.partnerPhone}</p>
                          <p className="text-gray-700 text-sm"><span className="text-gray-400">ETA: </span>{order.estimatedDelivery}</p>
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Items</p>
                        <div className="space-y-1.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.name || item.menuItem?.name || "Item"} × {item.quantity}
                              </span>
                              <span className="text-gray-900">
                                {formatCurrency(Number(item.price) * item.quantity)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2 mt-2">
                            <span className="text-gray-900">Total</span>
                            <span className="text-blue-600">{formatCurrency(Number(order.total))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicators for terminal states */}
                      {order.status === "DELIVERED" && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Delivered
                        </div>
                      )}
                      {order.status === "CANCELLED" && (
                        <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          Cancelled
                        </div>
                      )}

                      {/* Danger zone */}
                      <div className="flex justify-end border-t border-gray-100 pt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(order.id)}
                          disabled={!!actionLoading}
                        >
                          <Trash2 className="w-3 h-3" />
                          {actionLoading === order.id + "DELETE" ? "Deleting…" : "Delete Order"}
                        </Button>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
