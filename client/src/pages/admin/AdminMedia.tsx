import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebsiteContent } from "@shared/schema";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { DEFAULT_SITE_IMAGES, parseSiteImages, type SiteImages } from "@/lib/siteImages";

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const { data: content } = useQuery<WebsiteContent[]>({ queryKey: ["/api/admin/website-content"] });
  const [images, setImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const row = content?.find((c) => c.key === "site_images");
    if (row) setImages(parseSiteImages(row.value));
  }, [content]);

  const save = useMutation({
    mutationFn: () =>
      apiRequest("PUT", "/api/admin/website-content/site_images", {
        label: "Site Images",
        value: JSON.stringify(images),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/website-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/website-content"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function updateGallery(section: "home" | "visit" | "about", index: number, url: string) {
    setImages((prev) => {
      if (section === "about") {
        const sections = [...prev.about.sections];
        sections[index] = url;
        return { ...prev, about: { sections } };
      }
      const gallery = [...prev[section].gallery];
      gallery[index] = url;
      return { ...prev, [section]: { ...prev[section], gallery } };
    });
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl mb-1">Media</h1>
      <p className="text-ivory/50 text-sm mb-8">
        Every photo on the public site (other than event cover images, which are set on each event) lives here.
        Upload a new photo or paste a URL for any slot below, then save.
      </p>

      <div className="space-y-10">
        <section className="border border-ivory/10 p-6 space-y-6">
          <h2 className="font-display text-xl">Home Page</h2>
          <ImageUploadField
            label="Hero Background"
            value={images.home.hero}
            onChange={(url) => setImages((p) => ({ ...p, home: { ...p.home, hero: url } }))}
            folder="home"
          />
          <ImageUploadField
            label="Introduction Section"
            value={images.home.intro}
            onChange={(url) => setImages((p) => ({ ...p, home: { ...p.home, intro: url } }))}
            folder="home"
          />
          <ImageUploadField
            label="Saturday Bollywood Jamming Section"
            value={images.home.bollywood}
            onChange={(url) => setImages((p) => ({ ...p, home: { ...p.home, bollywood: url } }))}
            folder="home"
          />
          <ImageUploadField
            label="Lost Recipes Section"
            value={images.home.lostRecipes}
            onChange={(url) => setImages((p) => ({ ...p, home: { ...p.home, lostRecipes: url } }))}
            folder="home"
          />
          <ImageUploadField
            label="Location Section"
            value={images.home.location}
            onChange={(url) => setImages((p) => ({ ...p, home: { ...p.home, location: url } }))}
            folder="home"
          />
          <div>
            <p className="eyebrow mb-4">Instagram-Style Gallery</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {images.home.gallery.map((url, i) => (
                <ImageUploadField
                  key={i}
                  label={`Gallery Image ${i + 1}`}
                  value={url}
                  onChange={(u) => updateGallery("home", i, u)}
                  folder="home"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border border-ivory/10 p-6 space-y-6">
          <h2 className="font-display text-xl">About Page</h2>
          <p className="text-ivory/40 text-xs">
            These match the 7 sections on the About page in order: Our Story, Seasonal Philosophy, Craftsmanship,
            Hospitality, Culinary Approach, Atmosphere, Events &amp; Experiences.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {images.about.sections.map((url, i) => (
              <ImageUploadField
                key={i}
                label={`Section ${i + 1} Image`}
                value={url}
                onChange={(u) => updateGallery("about", i, u)}
                folder="about"
              />
            ))}
          </div>
        </section>

        <section className="border border-ivory/10 p-6 space-y-6">
          <h2 className="font-display text-xl">Visit Us Page</h2>
          <ImageUploadField
            label="Exterior Photo"
            value={images.visit.hero}
            onChange={(url) => setImages((p) => ({ ...p, visit: { ...p.visit, hero: url } }))}
            folder="visit"
          />
          <div>
            <p className="eyebrow mb-4">Gallery</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {images.visit.gallery.map((url, i) => (
                <ImageUploadField
                  key={i}
                  label={`Gallery Image ${i + 1}`}
                  value={url}
                  onChange={(u) => updateGallery("visit", i, u)}
                  folder="visit"
                />
              ))}
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save All Images"}
          </Button>
          {saved && <span className="text-emerald-400 text-sm">Saved — live across the site.</span>}
        </div>
        {save.isError && (
          <p className="text-sm text-red-400">
            {save.error instanceof ApiError ? save.error.message : "Could not save images."}
          </p>
        )}
      </div>
    </div>
  );
}
