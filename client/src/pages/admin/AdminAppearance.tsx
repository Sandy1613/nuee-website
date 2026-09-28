import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import type { WebsiteContent } from "@shared/schema";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Field";
import {
  BODY_FONTS,
  DEFAULT_THEME,
  HEADING_FONTS,
  deriveThemeVariables,
  loadGoogleFont,
  parseThemeConfig,
  type SiteTheme,
} from "@/lib/theme";

export default function AdminAppearance() {
  const queryClient = useQueryClient();
  const { data: content } = useQuery<WebsiteContent[]>({ queryKey: ["/api/admin/website-content"] });
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const row = content?.find((c) => c.key === "theme_config");
    if (row) setTheme(parseThemeConfig(row.value));
  }, [content]);

  useEffect(() => {
    loadGoogleFont(theme.fonts.heading);
    loadGoogleFont(theme.fonts.body);
  }, [theme.fonts.heading, theme.fonts.body]);

  const save = useMutation({
    mutationFn: () =>
      apiRequest("PUT", "/api/admin/website-content/theme_config", {
        label: "Theme Configuration",
        value: JSON.stringify(theme),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/website-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/website-content"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const previewStyle = {
    ...deriveThemeVariables(theme.colors),
    "--font-display": `'${theme.fonts.heading}', serif`,
    "--font-sans": `'${theme.fonts.body}', system-ui, sans-serif`,
  } as React.CSSProperties;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl mb-1">Appearance</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Change the site's colors and fonts without touching any code. Changes apply across the whole public site
        and admin dashboard as soon as you save.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="border border-ivory/10 p-6">
            <h2 className="font-display text-xl mb-5">Colors</h2>
            <div className="space-y-5">
              <ColorField
                label="Background"
                hint="Main page background (currently deep charcoal)"
                value={theme.colors.background}
                onChange={(v) => setTheme((t) => ({ ...t, colors: { ...t.colors, background: v } }))}
              />
              <ColorField
                label="Text"
                hint="Body and heading text color (currently warm ivory)"
                value={theme.colors.text}
                onChange={(v) => setTheme((t) => ({ ...t, colors: { ...t.colors, text: v } }))}
              />
              <ColorField
                label="Accent"
                hint="Buttons, links and highlights (currently muted gold)"
                value={theme.colors.accent}
                onChange={(v) => setTheme((t) => ({ ...t, colors: { ...t.colors, accent: v } }))}
              />
            </div>
          </section>

          <section className="border border-ivory/10 p-6">
            <h2 className="font-display text-xl mb-5">Fonts</h2>
            <div className="space-y-5">
              <div>
                <Label>Heading Font</Label>
                <Select
                  value={theme.fonts.heading}
                  onChange={(e) => setTheme((t) => ({ ...t, fonts: { ...t.fonts, heading: e.target.value } }))}
                >
                  {HEADING_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Body Font</Label>
                <Select
                  value={theme.fonts.body}
                  onChange={(e) => setTheme((t) => ({ ...t, fonts: { ...t.fonts, body: e.target.value } }))}
                >
                  {BODY_FONTS.map((f) => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save Theme"}
            </Button>
            <Button variant="ghost" onClick={() => setTheme(DEFAULT_THEME)}>
              <RotateCcw size={14} /> Reset to Default
            </Button>
            {saved && <span className="text-emerald-400 text-sm">Saved — live across the site.</span>}
          </div>
          {save.isError && (
            <p className="text-sm text-red-400">
              {save.error instanceof ApiError ? save.error.message : "Could not save theme."}
            </p>
          )}
        </div>

        <div>
          <p className="eyebrow mb-4">Live Preview</p>
          <div
            style={previewStyle}
            className="border p-8 space-y-6"
            data-preview-scope
          >
            <PreviewCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer border border-ivory/20 bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 bg-transparent border border-ivory/20 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gold"
        />
        <p className="text-xs text-ivory/40">{hint}</p>
      </div>
    </div>
  );
}

// Scoped preview: this subtree sets its own CSS variables (see previewStyle
// above), which override the page-wide ones only for descendants — so
// editing here never affects the rest of the admin UI until you hit Save.
function PreviewCard() {
  return (
    <div
      style={{
        background: "rgb(var(--color-charcoal))",
        color: "rgb(var(--color-ivory))",
        fontFamily: "var(--font-sans)",
      }}
      className="p-8 -m-8"
    >
      <p
        style={{ color: "rgb(var(--color-gold))", fontFamily: "var(--font-sans)" }}
        className="text-xs uppercase tracking-widest mb-3"
      >
        Kalyani Nagar, Pune
      </p>
      <h3 style={{ fontFamily: "var(--font-display)" }} className="text-3xl mb-4">
        An Evening, Unhurried.
      </h3>
      <p style={{ color: "rgb(var(--color-ivory-dim))" }} className="text-sm mb-6 leading-relaxed">
        Nuée Tavern & Bar — fine dining, live evenings and seasonal menus in Kalyani Nagar, Pune.
      </p>
      <button
        style={{ background: "rgb(var(--color-gold))", color: "rgb(var(--color-charcoal-deep))" }}
        className="px-6 py-3 text-xs uppercase tracking-widest font-medium"
      >
        Book a Table
      </button>
    </div>
  );
}
