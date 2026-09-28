// Every editable image on the public site (outside of events, which have
// their own Cover Image field) lives in one JSON blob under the
// "site_images" website_content key — same pattern as theme_config.
export interface SiteImages {
  home: {
    hero: string;
    intro: string;
    bollywood: string;
    lostRecipes: string;
    location: string;
    gallery: string[];
  };
  about: {
    sections: string[];
  };
  visit: {
    hero: string;
    gallery: string[];
  };
}

export const DEFAULT_SITE_IMAGES: SiteImages = {
  home: {
    hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop",
    intro: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
    bollywood: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
    lostRecipes: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200&auto=format&fit=crop",
    location: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=800&auto=format&fit=crop",
    ],
  },
  about: {
    sections: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  visit: {
    hero: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1400&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=900&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=900&auto=format&fit=crop",
    ],
  },
};

export function parseSiteImages(raw: string | undefined): SiteImages {
  if (!raw) return DEFAULT_SITE_IMAGES;
  try {
    const parsed = JSON.parse(raw);
    return {
      home: { ...DEFAULT_SITE_IMAGES.home, ...parsed.home, gallery: parsed.home?.gallery ?? DEFAULT_SITE_IMAGES.home.gallery },
      about: { sections: parsed.about?.sections ?? DEFAULT_SITE_IMAGES.about.sections },
      visit: { ...DEFAULT_SITE_IMAGES.visit, ...parsed.visit, gallery: parsed.visit?.gallery ?? DEFAULT_SITE_IMAGES.visit.gallery },
    };
  } catch {
    return DEFAULT_SITE_IMAGES;
  }
}
