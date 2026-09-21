import "dotenv/config";
import { db, pool } from "./db";
import {
  adminUsers,
  events,
  eventSessions,
  menuCategories,
  menuItems,
  reviews,
  faqs,
  websiteContent,
} from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

function nextWeekday(from: Date, weekday: number, weeksAhead = 0): Date {
  const date = new Date(from);
  const diff = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff + weeksAhead * 7);
  return date;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@nuee.example").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "NueeAdmin!2024";
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }
  const passwordHash = await hashPassword(password);
  await db.insert(adminUsers).values({
    name: "Nuée Admin",
    email,
    passwordHash,
    role: "admin",
  });
  console.log(`Created admin user: ${email} (password from ADMIN_PASSWORD env var)`);
}

async function seedEvents() {
  const [existingBollywood] = await db.select().from(events).where(eq(events.slug, "saturday-bollywood-jamming"));
  if (!existingBollywood) {
    const [bollywood] = await db
      .insert(events)
      .values({
        slug: "saturday-bollywood-jamming",
        title: "Saturday Bollywood Jamming Session",
        category: "Live Music",
        theme: "Bollywood, Live Band & Intimate Dining",
        recurrenceLabel: "Every Saturday",
        shortDescription:
          "Live Bollywood music and an intimate dining atmosphere — every Saturday evening at Nuée.",
        description:
          "Settle into a candlelit corner of the tavern as our resident band takes you through an evening of Bollywood favourites, old and new. Expect soulful acoustic sets, a warm crowd, and a menu built for lingering over. This is Nuée at its most convivial — come for dinner, stay for the encore.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=1600&auto=format&fit=crop",
        galleryImageUrls: [
          "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop",
        ],
        venue: "Nuée Tavern & Bar, Kalyani Nagar, Pune",
        mapsLink: "https://maps.google.com/?q=Nuee+Tavern+Bar+Kalyani+Nagar+Pune",
        host: "Nuée House Band",
        inclusions: "Live music, reserved seating, à la carte dining available",
        foodBeverageInfo:
          "Full à la carte menu and bar service available through the evening. No fixed menu or cover charge.",
        displayPrice: "No cover charge — à la carte dining",
        maxGuestsPerBooking: 10,
        dressCode: "Smart casual",
        ageRequirement: "All ages welcome",
        cancellationPolicy:
          "This is a complimentary entry event. We simply ask that you let us know if your plans change so we can offer your table to another guest.",
        faqs: [
          {
            question: "Is there an entry fee?",
            answer: "No — the Saturday Bollywood Jamming session is complimentary. Regular à la carte pricing applies for food and drink.",
          },
          {
            question: "Do I need a reservation?",
            answer: "Reservations are recommended, especially for larger groups, as seating is limited and fills up quickly.",
          },
        ],
        isFeatured: true,
        status: "published",
        sortOrder: 1,
      })
      .returning();

    const saturdaySessions = [0, 1, 2, 3].map((weeksAhead) => {
      const date = nextWeekday(new Date(), 6, weeksAhead);
      return {
        eventId: bollywood.id,
        name: "Saturday Evening",
        sessionDate: toDateOnly(date),
        startTime: "19:30",
        endTime: "23:00",
        capacity: 60,
        displayPrice: "No cover charge",
      };
    });
    await db.insert(eventSessions).values(saturdaySessions);
  }

  const [existingLostRecipes] = await db.select().from(events).where(eq(events.slug, "lost-recipes-of-maharashtra"));
  if (!existingLostRecipes) {
    const [lostRecipes] = await db
      .insert(events)
      .values({
        slug: "lost-recipes-of-maharashtra",
        title: "Lost Recipes of Maharashtra",
        category: "Culinary Experience",
        theme: "Regional Heritage Tasting Menu",
        recurrenceLabel: "Every Sunday",
        shortDescription: "A curated exploration of forgotten regional recipes, every Sunday at Nuée.",
        description:
          "Our chefs travel the villages of Maharashtra so you don't have to. Lost Recipes is a rotating tasting menu built around recipes that have quietly disappeared from restaurant menus — revived, plated with care, and served family-style. Each Sunday brings a new chapter of the region's culinary history to the table.",
        coverImageUrl:
          "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1600&auto=format&fit=crop",
        galleryImageUrls: [
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop",
        ],
        venue: "Nuée Tavern & Bar, Kalyani Nagar, Pune",
        mapsLink: "https://maps.google.com/?q=Nuee+Tavern+Bar+Kalyani+Nagar+Pune",
        host: "Nuée Culinary Team",
        inclusions: "Multi-course tasting menu, curated by the chef, reservation required",
        foodBeverageInfo: "Set tasting menu — vegetarian and non-vegetarian variants available on request.",
        displayPrice: "₹2,500++ per person",
        maxGuestsPerBooking: 8,
        dressCode: "Smart casual",
        ageRequirement: "All ages welcome",
        cancellationPolicy:
          "As this is a reservation-only tasting menu, we request at least 24 hours' notice for cancellations so we can plan accordingly.",
        faqs: [
          {
            question: "Is this a fixed menu?",
            answer: "Yes, Lost Recipes is a curated multi-course tasting menu that changes seasonally. Please let us know of any allergies in advance.",
          },
          {
            question: "Can I book for lunch and dinner?",
            answer: "Lunch and dinner are separate sessions, each with their own limited seating — please choose one when booking.",
          },
        ],
        isFeatured: true,
        status: "published",
        sortOrder: 2,
      })
      .returning();

    const sundaySessions = [0, 1, 2, 3].flatMap((weeksAhead) => {
      const date = toDateOnly(nextWeekday(new Date(), 0, weeksAhead));
      return [
        {
          eventId: lostRecipes.id,
          name: "Sunday Lunch",
          sessionDate: date,
          startTime: "13:30",
          endTime: "16:00",
          capacity: 32,
          displayPrice: "₹2,500++ per person",
        },
        {
          eventId: lostRecipes.id,
          name: "Sunday Dinner",
          sessionDate: date,
          startTime: "19:30",
          endTime: "22:30",
          capacity: 32,
          displayPrice: "₹2,500++ per person",
        },
      ];
    });
    await db.insert(eventSessions).values(sundaySessions);
  }
}

async function seedMenu() {
  const existing = await db.select().from(menuCategories);
  if (existing.length > 0) {
    console.log("Menu categories already exist, skipping menu seed.");
    return;
  }

  const categoryDefs = [
    { name: "Starters", type: "food" as const, subtype: "veg" as const, sortOrder: 1 },
    { name: "Starters", type: "food" as const, subtype: "non_veg" as const, sortOrder: 2 },
    { name: "Mains", type: "food" as const, subtype: "veg" as const, sortOrder: 3 },
    { name: "Mains", type: "food" as const, subtype: "non_veg" as const, sortOrder: 4 },
    { name: "Cocktails", type: "beverage" as const, subtype: "none" as const, sortOrder: 5 },
    { name: "Wine & Bar", type: "beverage" as const, subtype: "none" as const, sortOrder: 6 },
  ];
  const insertedCategories = await db.insert(menuCategories).values(categoryDefs).returning();

  const findCat = (name: string, subtype: string) =>
    insertedCategories.find((c) => c.name === name && c.subtype === subtype)!;

  const sampleItems = [
    {
      category: findCat("Starters", "veg"),
      name: "Charred Corn & Peanut Chaat (Sample)",
      description: "Editable sample content — replace with your verified menu.",
      price: "₹425",
    },
    {
      category: findCat("Starters", "non_veg"),
      name: "Tandoori Prawns (Sample)",
      description: "Editable sample content — replace with your verified menu.",
      price: "₹695",
    },
    {
      category: findCat("Mains", "veg"),
      name: "Wild Mushroom Risotto (Sample)",
      description: "Editable sample content — replace with your verified menu.",
      price: "₹575",
    },
    {
      category: findCat("Mains", "non_veg"),
      name: "Slow-Braised Lamb Shank (Sample)",
      description: "Editable sample content — replace with your verified menu.",
      price: "₹895",
    },
    {
      category: findCat("Cocktails", "none"),
      name: "Nuée Old Fashioned (Sample)",
      description: "Editable sample content — replace with your verified menu.",
      price: "₹650",
    },
    {
      category: findCat("Wine & Bar", "none"),
      name: "House Red, by the glass (Sample)",
      description: "Editable sample content — replace with your verified menu.",
      price: "₹450",
    },
  ];

  await db.insert(menuItems).values(
    sampleItems.map((item, idx) => ({
      categoryId: item.category.id,
      name: item.name,
      description: item.description,
      price: item.price,
      sortOrder: idx,
    })),
  );
}

async function seedReviews() {
  const existing = await db.select().from(reviews);
  if (existing.length > 0) return;
  await db.insert(reviews).values([
    {
      guestName: "Ananya R.",
      rating: 5,
      reviewText:
        "Sample review — replace with a verified guest quote. The Saturday jamming night had a wonderful, unhurried energy.",
      source: "Google",
      sortOrder: 1,
    },
    {
      guestName: "Rohan K.",
      rating: 5,
      reviewText:
        "Sample review — replace with a verified guest quote. Lost Recipes was one of the most thoughtful tasting menus we've had in Pune.",
      source: "Instagram",
      sortOrder: 2,
    },
    {
      guestName: "Meera S.",
      rating: 4,
      reviewText: "Sample review — replace with a verified guest quote. Beautiful room, calm service, lovely cocktails.",
      source: "Google",
      sortOrder: 3,
    },
  ]);
}

async function seedFaqs() {
  const existing = await db.select().from(faqs);
  if (existing.length > 0) return;
  await db.insert(faqs).values([
    {
      question: "Do I need to book in advance?",
      answer: "We recommend booking ahead, especially for weekend evenings and our Saturday and Sunday experiences.",
      category: "booking",
      sortOrder: 1,
    },
    {
      question: "Is online payment available?",
      answer: "Online payments are coming soon. For now, all bookings are confirmed as reservations and settled at the restaurant.",
      category: "booking",
      sortOrder: 2,
    },
    {
      question: "Do you accommodate dietary restrictions?",
      answer: "Yes — please mention allergies or dietary preferences when booking and our team will take care of the rest.",
      category: "general",
      sortOrder: 3,
    },
    {
      question: "Is parking available?",
      answer: "Valet and on-street parking are available near Kalyani Nagar. Details are on our Visit Us page.",
      category: "general",
      sortOrder: 4,
    },
  ]);
}

async function seedWebsiteContent() {
  const entries: { key: string; label: string; value: string }[] = [
    { key: "address", label: "Full Address", value: "Nuée Tavern & Bar, Kalyani Nagar, Pune, Maharashtra, India" },
    { key: "phone", label: "Telephone Number", value: "+91 98765 43210" },
    { key: "email", label: "Contact Email", value: "hello@nuee.example" },
    {
      key: "hours",
      label: "Opening Hours",
      value: "Mon–Fri: 5:00 PM – 12:00 AM  |  Sat–Sun: 12:30 PM – 12:00 AM",
    },
    { key: "maps_link", label: "Google Maps Link", value: "https://maps.google.com/?q=Nuee+Tavern+Bar+Kalyani+Nagar+Pune" },
    { key: "instagram_handle", label: "Instagram Handle", value: "@nuee.tavern" },
    {
      key: "hero_title",
      label: "Home Hero Title",
      value: "An Evening, Unhurried.",
    },
    {
      key: "hero_subtitle",
      label: "Home Hero Subtitle",
      value: "Nuée Tavern & Bar — fine dining, live evenings and seasonal menus in Kalyani Nagar, Pune.",
    },
    {
      key: "intro_text",
      label: "Nuée Introduction",
      value:
        "Nuée is a tavern and bar built around slowness — considered plates, warm light, and evenings that don't rush toward last call. We draw from the region's produce and its forgotten recipes in equal measure, serving both with the same quiet confidence.",
    },
    {
      key: "parking_info",
      label: "Parking & Dining Information",
      value: "Valet parking available on weekends. Ample on-street parking on weekdays. Indoor and courtyard seating both available on request.",
    },
  ];
  for (const entry of entries) {
    const [existing] = await db.select().from(websiteContent).where(eq(websiteContent.key, entry.key));
    if (!existing) {
      await db.insert(websiteContent).values(entry);
    }
  }
}

async function main() {
  console.log("Seeding Nuée database...");
  await seedAdmin();
  await seedEvents();
  await seedMenu();
  await seedReviews();
  await seedFaqs();
  await seedWebsiteContent();
  console.log("Seed complete.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
