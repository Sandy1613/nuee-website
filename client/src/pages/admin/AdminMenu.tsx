import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { MenuCategory, MenuItem, InsertMenuCategory, InsertMenuItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";

type CategoryWithItems = MenuCategory & { items: MenuItem[] };

const emptyCategory: InsertMenuCategory = { name: "", type: "food", subtype: "veg", sortOrder: 0, isActive: true };
const emptyItem: InsertMenuItem = {
  categoryId: 0,
  name: "",
  description: "",
  price: "",
  dietaryTag: "none",
  isSignature: false,
  isAvailable: true,
  sortOrder: 0,
};

export default function AdminMenu() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery<CategoryWithItems[]>({ queryKey: ["/api/admin/menu"] });
  const [categoryDraft, setCategoryDraft] = useState(emptyCategory);
  const [itemDrafts, setItemDrafts] = useState<Record<number, InsertMenuItem>>({});

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/menu"] });

  const createCategory = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/menu/categories", categoryDraft),
    onSuccess: () => {
      setCategoryDraft(emptyCategory);
      invalidate();
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMenuCategory> }) =>
      apiRequest("PUT", `/api/admin/menu/categories/${id}`, data),
    onSuccess: invalidate,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/menu/categories/${id}`),
    onSuccess: invalidate,
  });

  const createItem = useMutation({
    mutationFn: (categoryId: number) => apiRequest("POST", "/api/admin/menu/items", { ...emptyItem, ...itemDrafts[categoryId], categoryId }),
    onSuccess: (_data, categoryId) => {
      setItemDrafts((prev) => ({ ...prev, [categoryId]: { ...emptyItem, categoryId } }));
      invalidate();
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertMenuItem> }) =>
      apiRequest("PUT", `/api/admin/menu/items/${id}`, data),
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/menu/items/${id}`),
    onSuccess: invalidate,
  });

  function moveCategory(cat: CategoryWithItems, direction: -1 | 1) {
    updateCategory.mutate({ id: cat.id, data: { sortOrder: cat.sortOrder + direction } });
  }

  function moveItem(item: MenuItem, direction: -1 | 1) {
    updateItem.mutate({ id: item.id, data: { sortOrder: item.sortOrder + direction } });
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Menu</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Add, edit, remove and reorder categories and items. Sample content is clearly labelled — replace with verified dishes.
      </p>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="space-y-8 mb-10">
        {(categories ?? []).map((cat) => (
          <div key={cat.id} className="border border-ivory/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-xl">{cat.name}</h3>
                <span className="text-xs uppercase tracking-widest text-ivory/40 border border-ivory/15 px-2 py-1">
                  {cat.type}{cat.subtype !== "none" ? ` · ${cat.subtype}` : ""}
                </span>
                {!cat.isActive && <span className="text-xs text-red-400">Hidden</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => moveCategory(cat, -1)} className="text-ivory/40 hover:text-gold"><ArrowUp size={14} /></button>
                <button onClick={() => moveCategory(cat, 1)} className="text-ivory/40 hover:text-gold"><ArrowDown size={14} /></button>
                <label className="flex items-center gap-1.5 text-xs text-ivory/50 ml-2">
                  <input type="checkbox" className="accent-gold w-3.5 h-3.5" checked={cat.isActive} onChange={(e) => updateCategory.mutate({ id: cat.id, data: { isActive: e.target.checked } })} />
                  Active
                </label>
                <button onClick={() => confirm("Delete this category and its items?") && deleteCategory.mutate(cat.id)} className="text-ivory/40 hover:text-red-400 ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {cat.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 border border-ivory/5 bg-ivory/[0.02] px-4 py-3">
                  <div>
                    <p className="text-ivory text-sm">{item.name} {item.isSignature && <span className="text-gold text-[10px] uppercase ml-1">Signature</span>}</p>
                    <p className="text-ivory/40 text-xs">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gold text-sm">{item.price}</span>
                    <button onClick={() => moveItem(item, -1)} className="text-ivory/40 hover:text-gold"><ArrowUp size={12} /></button>
                    <button onClick={() => moveItem(item, 1)} className="text-ivory/40 hover:text-gold"><ArrowDown size={12} /></button>
                    <label className="flex items-center gap-1 text-[10px] text-ivory/50">
                      <input type="checkbox" className="accent-gold w-3 h-3" checked={item.isAvailable} onChange={(e) => updateItem.mutate({ id: item.id, data: { isAvailable: e.target.checked } })} />
                      Available
                    </label>
                    <button onClick={() => deleteItem.mutate(item.id)} className="text-ivory/40 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end border-t border-ivory/10 pt-4">
              <Input
                placeholder="Item name"
                value={itemDrafts[cat.id]?.name ?? ""}
                onChange={(e) => setItemDrafts((p) => ({ ...p, [cat.id]: { ...emptyItem, ...p[cat.id], categoryId: cat.id, name: e.target.value } }))}
              />
              <Input
                placeholder="Description"
                value={itemDrafts[cat.id]?.description ?? ""}
                onChange={(e) => setItemDrafts((p) => ({ ...p, [cat.id]: { ...emptyItem, ...p[cat.id], categoryId: cat.id, description: e.target.value } }))}
              />
              <Input
                placeholder="Price"
                value={itemDrafts[cat.id]?.price ?? ""}
                onChange={(e) => setItemDrafts((p) => ({ ...p, [cat.id]: { ...emptyItem, ...p[cat.id], categoryId: cat.id, price: e.target.value } }))}
              />
              <label className="flex items-center gap-1.5 text-xs text-ivory/50">
                <input
                  type="checkbox"
                  className="accent-gold w-3.5 h-3.5"
                  checked={itemDrafts[cat.id]?.isSignature ?? false}
                  onChange={(e) => setItemDrafts((p) => ({ ...p, [cat.id]: { ...emptyItem, ...p[cat.id], categoryId: cat.id, isSignature: e.target.checked } }))}
                />
                Signature
              </label>
              <Button size="sm" onClick={() => createItem.mutate(cat.id)} disabled={!itemDrafts[cat.id]?.name}>
                <Plus size={14} /> Add Item
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-ivory/10 p-6">
        <h3 className="font-display text-xl mb-4">Add Category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Name</Label>
            <Input value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={categoryDraft.type} onChange={(e) => setCategoryDraft({ ...categoryDraft, type: e.target.value as "food" | "beverage" })}>
              <option value="food">Food</option>
              <option value="beverage">Beverage</option>
            </Select>
          </div>
          <div>
            <Label>Subtype</Label>
            <Select
              value={categoryDraft.subtype}
              onChange={(e) => setCategoryDraft({ ...categoryDraft, subtype: e.target.value as "veg" | "non_veg" | "none" })}
              disabled={categoryDraft.type === "beverage"}
            >
              <option value="veg">Vegetarian</option>
              <option value="non_veg">Non-Vegetarian</option>
              <option value="none">N/A</option>
            </Select>
          </div>
          <Button onClick={() => createCategory.mutate()} disabled={!categoryDraft.name}>
            <Plus size={14} /> Add Category
          </Button>
        </div>
      </div>
    </div>
  );
}
