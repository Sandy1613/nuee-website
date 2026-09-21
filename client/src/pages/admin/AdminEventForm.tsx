import { useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { insertEventSchema, type InsertEvent, type EventWithSessions } from "@shared/schema";
import { apiRequest, ApiError } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, Select, FieldError } from "@/components/ui/Field";
import { AdminSessionsManager } from "@/components/admin/AdminSessionsManager";

const defaultValues: InsertEvent = {
  slug: "",
  title: "",
  category: "",
  theme: "",
  recurrenceLabel: "",
  shortDescription: "",
  description: "",
  coverImageUrl: "",
  galleryImageUrls: [],
  venue: "Nuée Tavern & Bar, Kalyani Nagar, Pune",
  mapsLink: "",
  host: "",
  inclusions: "",
  foodBeverageInfo: "",
  displayPrice: "",
  maxGuestsPerBooking: 10,
  bookingOpensAt: null,
  bookingClosesAt: null,
  cancellationPolicy: "",
  dressCode: "Smart casual",
  ageRequirement: "All ages welcome",
  faqs: [],
  isFeatured: false,
  status: "draft",
  sortOrder: 0,
};

export default function AdminEventForm() {
  const params = useParams<{ id?: string }>();
  const isNew = !params.id || params.id === "new";
  const eventId = isNew ? undefined : Number(params.id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery<EventWithSessions>({
    queryKey: [`/api/admin/events/${eventId}`],
    enabled: !!eventId,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<InsertEvent>({ resolver: zodResolver(insertEventSchema), defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: "faqs" });

  useEffect(() => {
    if (existing) {
      reset({
        ...existing,
        bookingOpensAt: existing.bookingOpensAt,
        bookingClosesAt: existing.bookingClosesAt,
      });
    }
  }, [existing, reset]);

  const create = useMutation({
    mutationFn: async (data: InsertEvent) => {
      const res = await apiRequest("POST", "/api/admin/events", data);
      return res.json();
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      navigate(`/admin/events/${event.id}`);
    },
  });

  const update = useMutation({
    mutationFn: async (data: InsertEvent) => {
      const res = await apiRequest("PUT", `/api/admin/events/${eventId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${eventId}`] });
    },
  });

  const mutation = isNew ? create : update;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/events" className="text-xs text-gold uppercase tracking-widest">← All Events</Link>
          <h1 className="font-display text-3xl mt-2">{isNew ? "New Event" : "Edit Event"}</h1>
        </div>
        {existing && (
          <a href={`/events/${existing.slug}`} target="_blank" rel="noreferrer" className="text-xs text-gold underline underline-offset-4">
            Preview Live Page
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-10">
        <section className="border border-ivory/10 p-6 space-y-5">
          <h2 className="font-display text-xl mb-2">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Event Title</Label>
              <Input {...register("title")} />
              <FieldError>{errors.title?.message}</FieldError>
            </div>
            <div>
              <Label>Category</Label>
              <Input {...register("category")} placeholder="Live Music, Culinary Experience..." />
              <FieldError>{errors.category?.message}</FieldError>
            </div>
            <div>
              <Label>Theme</Label>
              <Input {...register("theme")} />
            </div>
            <div>
              <Label>Recurrence Label</Label>
              <Input {...register("recurrenceLabel")} placeholder="e.g. Every Saturday" />
            </div>
          </div>
          <div>
            <Label>Short Description</Label>
            <Textarea rows={2} {...register("shortDescription")} />
          </div>
          <div>
            <Label>Full Description</Label>
            <Textarea rows={6} {...register("description")} />
          </div>
        </section>

        <section className="border border-ivory/10 p-6 space-y-5">
          <h2 className="font-display text-xl mb-2">Media</h2>
          <div>
            <Label>Cover Image URL</Label>
            <Input {...register("coverImageUrl")} placeholder="https://... (upload-ready field)" />
          </div>
        </section>

        <section className="border border-ivory/10 p-6 space-y-5">
          <h2 className="font-display text-xl mb-2">Venue &amp; Host</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Venue</Label>
              <Input {...register("venue")} />
            </div>
            <div>
              <Label>Google Maps Link</Label>
              <Input {...register("mapsLink")} />
            </div>
            <div>
              <Label>Host / Artist / Chef / Curator</Label>
              <Input {...register("host")} />
            </div>
            <div>
              <Label>Display Price</Label>
              <Input {...register("displayPrice")} placeholder="₹2,500++ per person" />
            </div>
          </div>
          <div>
            <Label>Inclusions</Label>
            <Textarea rows={2} {...register("inclusions")} />
          </div>
          <div>
            <Label>Food &amp; Beverage Information</Label>
            <Textarea rows={2} {...register("foodBeverageInfo")} />
          </div>
        </section>

        <section className="border border-ivory/10 p-6 space-y-5">
          <h2 className="font-display text-xl mb-2">Booking Rules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Max Guests Per Booking</Label>
              <Input type="number" min={1} {...register("maxGuestsPerBooking", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Dress Code</Label>
              <Input {...register("dressCode")} />
            </div>
            <div>
              <Label>Age Requirement</Label>
              <Input {...register("ageRequirement")} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" {...register("sortOrder", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label>Cancellation Policy</Label>
            <Textarea rows={3} {...register("cancellationPolicy")} />
          </div>
        </section>

        <section className="border border-ivory/10 p-6 space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl">FAQs</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => append({ question: "", answer: "" })}>
              <Plus size={14} /> Add FAQ
            </Button>
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-ivory/10 p-4">
              <div>
                <Label>Question</Label>
                <Input {...register(`faqs.${i}.question` as const)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Answer</Label>
                  <Textarea rows={2} {...register(`faqs.${i}.answer` as const)} />
                </div>
                <button type="button" onClick={() => remove(i)} className="text-ivory/40 hover:text-red-400 mt-7">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="border border-ivory/10 p-6 flex flex-wrap items-center gap-8">
          <div>
            <Label>Publication Status</Label>
            <Select {...register("status")} className="w-56">
              {["draft", "scheduled", "published", "sold_out", "bookings_closed", "cancelled", "completed", "archived"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-3 text-sm text-ivory/70">
            <input type="checkbox" {...register("isFeatured")} className="accent-gold w-4 h-4" />
            Featured Event
          </label>
        </section>

        {mutation.isError && (
          <p className="text-sm text-red-400">
            {mutation.error instanceof ApiError ? mutation.error.message : "Could not save event."}
          </p>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : isNew ? "Create Event" : "Save Changes"}
          </Button>
        </div>
      </form>

      {existing && (
        <div className="mt-10">
          <AdminSessionsManager eventId={existing.id} sessions={existing.sessions} />
        </div>
      )}
    </div>
  );
}
