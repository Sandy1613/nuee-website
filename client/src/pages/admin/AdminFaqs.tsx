import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import type { Faq, InsertFaq } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";

const emptyDraft: InsertFaq = { question: "", answer: "", category: "general", sortOrder: 0, isPublished: true };

export default function AdminFaqs() {
  const queryClient = useQueryClient();
  const { data: faqs, isLoading } = useQuery<Faq[]>({ queryKey: ["/api/admin/faqs"] });
  const [draft, setDraft] = useState<InsertFaq>(emptyDraft);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/faqs", draft),
    onSuccess: () => {
      setDraft(emptyDraft);
      invalidate();
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      apiRequest("PUT", `/api/admin/faqs/${id}`, { isPublished }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/faqs/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <h1 className="font-display text-3xl mb-1">FAQs</h1>
      <p className="text-ivory/50 text-sm mb-8">General site FAQs (separate from per-event FAQs).</p>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="space-y-3 mb-10">
        {(faqs ?? []).map((f) => (
          <div key={f.id} className="border border-ivory/10 p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-ivory">{f.question}</p>
              <p className="text-ivory/50 text-sm mt-1 max-w-xl">{f.answer}</p>
              <p className="text-ivory/30 text-xs mt-1 uppercase tracking-widest">{f.category}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 text-xs text-ivory/60">
                <input
                  type="checkbox"
                  className="accent-gold w-4 h-4"
                  checked={f.isPublished}
                  onChange={(e) => togglePublish.mutate({ id: f.id, isPublished: e.target.checked })}
                />
                Published
              </label>
              <button onClick={() => remove.mutate(f.id)} className="text-ivory/40 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-ivory/10 p-6">
        <h3 className="font-display text-xl mb-4">Add FAQ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Question</Label>
            <Input value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </div>
        </div>
        <Label>Answer</Label>
        <Textarea rows={3} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} />
        <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending || !draft.question || !draft.answer}>
          <Plus size={14} /> Add FAQ
        </Button>
      </div>
    </div>
  );
}
