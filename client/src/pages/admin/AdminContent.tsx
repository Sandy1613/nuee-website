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
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    if (content) setValues(Object.fromEntries(content.map((c) => [c.key, c.value])));
  }, [content]);

  const save = useMutation({
    mutationFn: ({ key, label, value }: { key: string; label: string; value: string }) =>
      apiRequest("PUT", `/api/admin/website-content/${key}`, { label, value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/website-content"] }),
  });

  const addField = useMutation({
    mutationFn: () =>
      apiRequest("PUT", `/api/admin/website-content/${newKey.trim().toLowerCase().replace(/\s+/g, "_")}`, {
        label: newLabel,
        value: newValue,
      }),
    onSuccess: () => {
      setNewKey("");
      setNewLabel("");
      setNewValue("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/website-content"] });
    },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl mb-1">Website Content</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Editable text used across the public site — address, hours, hero copy and more.
      </p>

      <div className="border border-ivory/10 p-5 mb-8">
        <Label>Add New Field</Label>
        <p className="text-xs text-ivory/40 mb-3">
          For a new piece of text that doesn't have a field yet (e.g. a WhatsApp number, a second phone line).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            className="bg-transparent border border-ivory/20 px-3 py-2 text-sm focus:outline-none focus:border-gold"
            placeholder="Field name (e.g. Reservation Phone)"
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              setNewKey(e.target.value);
            }}
          />
          <input
            className="bg-transparent border border-ivory/20 px-3 py-2 text-sm focus:outline-none focus:border-gold"
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        {addField.isError && <p className="text-sm text-red-400 mb-2">Could not add this field.</p>}
        <Button size="sm" onClick={() => addField.mutate()} disabled={addField.isPending || !newLabel || !newValue}>
          Add Field
        </Button>
      </div>

      {isLoading && <p className="text-ivory/50">Loading…</p>}

      <div className="space-y-6">
        {(content ?? [])
          .filter((item) => item.key !== "theme_config" && item.key !== "site_images")
          .map((item) => (
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
