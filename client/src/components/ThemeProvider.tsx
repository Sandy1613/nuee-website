import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { applyTheme, parseThemeConfig } from "@/lib/theme";

/**
 * Fetches the saved theme (stored as JSON under the "theme_config" website
 * content key — see Admin → Appearance) and applies it as CSS custom
 * properties on <html>. Renders nothing; mount once near the app root.
 */
export function ThemeProvider() {
  const { data } = useQuery<Record<string, string>>({ queryKey: ["/api/website-content"] });

  useEffect(() => {
    applyTheme(parseThemeConfig(data?.theme_config));
  }, [data?.theme_config]);

  return null;
}
