import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WebsiteContent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Field";

export default function AdminContent() {
  const queryClient = useQueryClient();
  const { data: content, isLoading } = useQuery<WebsiteContent[]>({ queryKey: ["/api/admin/website-content"] });
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (content) setValues(Object.fromEntries(content.map((c) => [c.key, c.value])));
  }, [content]);

  const save = useMutation({
    mutationFn: ({ key, label, value }: { key: string; label: string; value: string }) =>
      apiRequest("PUT", `/api/admin/website-content/${key}`, { label, value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/website-content"] }),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-1">Website Content</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Editable text used across the public site — address, hours, hero copy and more.
      </p>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="space-y-6">
        {(content ?? []).map((item) => (
          <div key={item.key} className="border border-ivory/10 p-5">
            <Label>{item.label}</Label>
            <Textarea
              rows={item.value.length > 80 ? 3 : 1}
              value={values[item.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [item.key]: e.target.value }))}
            />
            <Button
              size="sm"
              className="mt-3"
              onClick={() => save.mutate({ key: item.key, label: item.label, value: values[item.key] ?? "" })}
              disabled={save.isPending}
            >
              Save
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
