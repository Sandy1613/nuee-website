// Shared demo content also mirrored by server/seed.ts's PostgreSQL seed data,
// kept as plain data (not DB rows) so server/storage.memory.ts can build its
// in-memory tables from it without touching Drizzle or Postgres at all.

export function nextWeekday(from: Date, weekday: number, weeksAhead = 0): Date {
  const date = new Date(from);
  const diff = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff + weeksAhead * 7);
  return date;
}

export function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const DEMO_WEBSITE_CONTENT: { key: string; label: string; value: string }[] = [
  { key: "address", label: "Full Address", value: "Nuée Tavern & Bar, Kalyani Nagar, Pune, Maharashtra, India" },
  { key: "phone", label: "Telephone Number", value: "+91 72493 16006" },
  { key: "reservation_phone", label: "Reservation / WhatsApp Number", value: "+91 86984 81561" },
  { key: "email", label: "Contact Email", value: "nuee.pune@gmail.com" },
  { key: "hours", label: "Opening Hours", value: "Daily: 11:00 AM – 12:00 Midnight" },
  { key: "maps_link", label: "Google Maps Link", value: "https://maps.google.com/?q=Nuee+Tavern+Bar+Kalyani+Nagar+Pune" },
  { key: "instagram_handle", label: "Instagram Handle", value: "@nuee.tavern" },
  { key: "hero_title", label: "Home Hero Title", value: "An Evening, Unhurried." },
  {
    key: "hero_subtitle",
    label: "Home Hero Subtitle",
    value: "Nuée Tavern & Bar — fine dining, live evenings and seasonal menus in Kalyani Nagar, Pune.",
  },
  {
    key: "intro_text",
    label: "Nuée Introduction",
    value:
      "Nuée opened as a tavern first, with a bar close behind it — the kind of place where nobody rushes you off a table for the next seating. The kitchen leans hard on Maharashtra's pantry: kokum, goda masala, jackfruit in season, whatever's good at the market that week. Most of it lands on the specials board before it ever makes the permanent menu.",
  },
  {
    key: "parking_info",
    label: "Parking & Dining Information",
    value: "Valet parking available.",
  },
  {
    key: "theme_config",
    label: "Theme Configuration",
    value: JSON.stringify({
      colors: { background: "#1b1917", text: "#f6f1e7", accent: "#b6903f" },
      fonts: { heading: "Playfair Display", body: "Inter" },
    }),
  },
];

export const DEMO_REVIEWS = [
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
];

export const DEMO_FAQS = [
  {
    question: "Do I need to book in advance?",
    answer: "We recommend booking ahead, especially for weekend evenings and our Saturday and Sunday experiences.",
    category: "booking",
    sortOrder: 1,
  },
  {
    question: "Is online payment available?",
    answer:
      "Online payments are coming soon. For now, all bookings are confirmed as reservations and settled at the restaurant.",
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
];

export const DEMO_MENU_CATEGORIES: {
  name: string;
  type: "food" | "beverage";
  subtype: "veg" | "non_veg" | "none";
  sortOrder: number;
  items: { name: string; description: string; price: string }[];
}[] = [
  {
    name: "Starters",
    type: "food",
    subtype: "veg",
    sortOrder: 1,
    items: [{ name: "Charred Corn & Peanut Chaat (Sample)", description: "Editable sample content — replace with your verified menu.", price: "₹425" }],
  },
  {
    name: "Starters",
    type: "food",
    subtype: "non_veg",
    sortOrder: 2,
    items: [{ name: "Tandoori Prawns (Sample)", description: "Editable sample content — replace with your verified menu.", price: "₹695" }],
  },
  {
    name: "Mains",
    type: "food",
    subtype: "veg",
    sortOrder: 3,
    items: [{ name: "Wild Mushroom Risotto (Sample)", description: "Editable sample content — replace with your verified menu.", price: "₹575" }],
  },
  {
    name: "Mains",
    type: "food",
    subtype: "non_veg",
    sortOrder: 4,
    items: [{ name: "Slow-Braised Lamb Shank (Sample)", description: "Editable sample content — replace with your verified menu.", price: "₹895" }],
  },
  {
    name: "Cocktails",
    type: "beverage",
    subtype: "none",
    sortOrder: 5,
    items: [{ name: "Nuée Old Fashioned (Sample)", description: "Editable sample content — replace with your verified menu.", price: "₹650" }],
  },
  {
    name: "Wine & Bar",
    type: "beverage",
    subtype: "none",
    sortOrder: 6,
    items: [{ name: "House Red, by the glass (Sample)", description: "Editable sample content — replace with your verified menu.", price: "₹450" }],
  },
];
