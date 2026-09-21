import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { Review, InsertReview } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";

const emptyDraft: InsertReview = { guestName: "", rating: 5, reviewText: "", source: "Google", isPublished: true, sortOrder: 0 };

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery<Review[]>({ queryKey: ["/api/admin/reviews"] });
  const [draft, setDraft] = useState<InsertReview>(emptyDraft);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/reviews", draft),
    onSuccess: () => {
      setDraft(emptyDraft);
      invalidate();
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      apiRequest("PUT", `/api/admin/reviews/${id}`, { isPublished }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/reviews/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">Reviews</h1>
      <p className="text-ivory/50 text-sm mb-8">Manage guest reviews shown on the home page.</p>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="space-y-3 mb-10">
        {(reviews ?? []).map((r) => (
          <div key={r.id} className="border border-ivory/10 p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-ivory">{r.guestName} · <span className="text-gold">{r.rating}★</span> · <span className="text-ivory/40 text-xs">{r.source}</span></p>
              <p className="text-ivory/60 text-sm mt-1 max-w-xl">{r.reviewText}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 text-xs text-ivory/60">
                <input
                  type="checkbox"
                  className="accent-gold w-4 h-4"
                  checked={r.isPublished}
                  onChange={(e) => togglePublish.mutate({ id: r.id, isPublished: e.target.checked })}
                />
                Published
              </label>
              <button onClick={() => remove.mutate(r.id)} className="text-ivory/40 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-ivory/10 p-6">
        <h3 className="font-display text-xl mb-4">Add Review</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <Label>Guest Name</Label>
            <Input value={draft.guestName} onChange={(e) => setDraft({ ...draft, guestName: e.target.value })} />
          </div>
          <div>
            <Label>Rating (1-5)</Label>
            <Input type="number" min={1} max={5} value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Source</Label>
            <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
          </div>
        </div>
        <Label>Review Text</Label>
        <Textarea rows={3} value={draft.reviewText} onChange={(e) => setDraft({ ...draft, reviewText: e.target.value })} />
        <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending || !draft.guestName || !draft.reviewText}>
          <Plus size={14} /> Add Review
        </Button>
      </div>
    </div>
  );
}
