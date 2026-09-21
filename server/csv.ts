export interface CsvBookingRow {
  reference: string;
  eventTitle?: string | null;
  sessionName?: string | null;
  sessionDate?: string | null;
  name: string;
  mobile: string;
  email: string;
  guestCount: number;
  status: string;
  source: string;
  dietaryPreferences: string;
  allergyInfo: string;
  specialRequests: string;
  createdAt: Date;
}

export function bookingsToCsv(rows: CsvBookingRow[]): string {
  const header = [
    "Reference",
    "Event",
    "Session",
    "Session Date",
    "Name",
    "Mobile",
    "Email",
    "Guests",
    "Status",
    "Source",
    "Dietary Preferences",
    "Allergy Info",
    "Special Requests",
    "Created At",
  ];
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const lines = [header.join(",")];
  for (const b of rows) {
    lines.push(
      [
        b.reference,
        b.eventTitle,
        b.sessionName,
        b.sessionDate,
        b.name,
        b.mobile,
        b.email,
        b.guestCount,
        b.status,
        b.source,
        b.dietaryPreferences,
        b.allergyInfo,
        b.specialRequests,
        b.createdAt.toISOString(),
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}
