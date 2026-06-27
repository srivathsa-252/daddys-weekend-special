"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  displayOrder: number;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  displayOrder: string;
}

const emptyForm: FormState = {
  name: "", description: "", price: "", image: "", isVeg: true, isAvailable: true, displayOrder: "0",
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeCount = items.filter((i) => i.isAvailable).length;
  const atLimit = activeCount >= 10;

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/admin/menu");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { fetchItems(); }, []);

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/menu/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (res.ok) {
      setForm((f) => ({ ...f, image: json.url }));
      toast.success("Image uploaded");
    } else {
      toast.error(json.error ?? "Upload failed");
    }
  }

  async function handleSave() {
    setFormError(null);
    if (!form.name || !form.description || !form.price || !form.image) {
      setFormError("All fields are required.");
      return;
    }
    setSaving(true);
    const body = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      image: form.image,
      isVeg: form.isVeg,
      isAvailable: form.isAvailable,
      displayOrder: parseInt(form.displayOrder) || 0,
    };

    const url = editId ? `/api/admin/menu?id=${editId}` : "/api/admin/menu";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setFormError(json.error ?? "Save failed");
      return;
    }

    toast.success(editId ? "Item updated" : "Item created");
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    fetchItems();
  }

  async function handleToggle(item: MenuItem) {
    if (!item.isAvailable && atLimit) {
      toast.error("Cannot enable: menu already has 10 active items.");
      return;
    }
    const res = await fetch(`/api/admin/menu?id=${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    if (res.ok) {
      toast.success(item.isAvailable ? "Item hidden" : "Item shown");
      fetchItems();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? If it has order history it will be hidden rather than removed.")) return;
    const res = await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      toast.success(json.message ?? "Deleted");
      fetchItems();
    } else {
      toast.error(json.error ?? "Delete failed");
    }
  }

  function openEdit(item: MenuItem) {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      image: item.image,
      isVeg: item.isVeg,
      isAvailable: item.isAvailable,
      displayOrder: String(item.displayOrder),
    });
    setFormError(null);
    setShowForm(true);
  }

  function openAdd() {
    if (atLimit) return;
    setEditId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-400 text-sm mt-1">{activeCount}/10 active items</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {atLimit && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-amber-600 text-sm max-w-xs text-right">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Menu limit reached (10/10). Disable or delete an item before adding a new one.</span>
            </div>
          )}
          <Button onClick={openAdd} disabled={atLimit}>
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-xl rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="font-sans text-xl font-bold text-gray-900">{editId ? "Edit Item" : "Add New Item"}</h2>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Weekend Ribeye" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the dish..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 resize-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (£)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="24.99" />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={form.displayOrder} onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))} placeholder="1" />
              </div>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Image</Label>
              {form.image && (
                <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
                  <Image src={form.image} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</> : "Upload Image"}
                </Button>
                {form.image && <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="Or paste URL" className="text-xs" />}
              </div>
              {!form.image && (
                <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="Paste Cloudinary URL" />
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isVeg"
                  checked={form.isVeg}
                  onChange={(e) => setForm((f) => ({ ...f, isVeg: e.target.checked }))}
                  className="w-4 h-4 accent-green-500"
                />
                <Label htmlFor="isVeg" className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center w-4 h-4 border-2 border-green-500 rounded-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </span>
                  Veg
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <Label htmlFor="isAvailable">Available on menu</Label>
              </div>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-sm">{formError}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Saving..." : editId ? "Save Changes" : "Create Item"}
              </Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditId(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No menu items yet. Add your first item!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={item.isAvailable ? "" : "opacity-50"}>
              <div className="relative h-40 overflow-hidden rounded-t-xl">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold uppercase tracking-widest">Hidden</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                  <span className="text-blue-600 font-bold text-sm whitespace-nowrap">{formatCurrency(item.price)}</span>
                </div>
                <p className="text-gray-500 text-xs line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={item.isAvailable ? "success" : "secondary"}>
                    {item.isAvailable ? "Active" : "Hidden"}
                  </Badge>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${item.isVeg ? "text-green-600" : "text-red-500"}`}>
                    <span className={`inline-flex items-center justify-center w-3.5 h-3.5 border-2 rounded-sm ${item.isVeg ? "border-green-500" : "border-red-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-400"}`} />
                    </span>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                  <span className="text-gray-300 text-xs ml-auto">#{item.displayOrder}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(item)} className="flex-1 text-xs">
                    <Edit2 className="w-3 h-3" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggle(item)} className="text-xs px-2">
                    {item.isAvailable ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="text-xs px-2 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
