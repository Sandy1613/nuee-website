import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { insertTableReservationSchema, type InsertTableReservation } from "@shared/schema";
import { useTableBookingModal } from "@/context/TableBookingModalContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Field";

export function TableReservationModal() {
  const { isOpen, close } = useTableBookingModal();
  const [reference, setReference] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InsertTableReservation>({
    resolver: zodResolver(insertTableReservationSchema),
    defaultValues: { partySize: 2, specialRequests: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertTableReservation) => {
      const res = await apiRequest("POST", "/api/table-reservations", data);
      return res.json();
    },
    onSuccess: (data) => setReference(data.reference),
  });

  function handleClose() {
    close();
    setTimeout(() => {
      setReference(null);
      reset();
      mutation.reset();
    }, 300);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-charcoal-deep/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-lg bg-charcoal border border-ivory/10 p-8 sm:p-10 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-ivory/50 hover:text-gold transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {reference ? (
              <div className="text-center py-8">
                <p className="eyebrow mb-3">Request Received</p>
                <h3 className="font-display text-3xl mb-4">Thank you.</h3>
                <p className="text-ivory/70 text-sm leading-relaxed mb-6">
                  Your table reservation request has been received and is{" "}
                  <span className="text-gold">pending confirmation</span>. Our team will call or message you shortly
                  to confirm your table.
                </p>
                <div className="border border-gold/30 bg-gold/5 px-6 py-4 mb-6">
                  <p className="text-xs uppercase tracking-widest text-ivory/50 mb-1">Reference</p>
                  <p className="font-display text-2xl text-gold">{reference}</p>
                </div>
                <Button onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <p className="eyebrow mb-2">Reserve a Table</p>
                <h3 className="font-display text-3xl mb-6">Book a Table</h3>
                <form
                  onSubmit={handleSubmit((data) => mutation.mutate(data))}
                  className="space-y-5"
                >
                  <div>
                    <Label>Full Name</Label>
                    <Input {...register("name")} placeholder="Your name" />
                    <FieldError>{errors.name?.message}</FieldError>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mobile Number</Label>
                      <Input {...register("mobile")} placeholder="+91" />
                      <FieldError>{errors.mobile?.message}</FieldError>
                    </div>
                    <div>
                      <Label>Party Size</Label>
                      <Input type="number" min={1} max={30} {...register("partySize", { valueAsNumber: true })} />
                      <FieldError>{errors.partySize?.message}</FieldError>
                    </div>
                  </div>
                  <div>
                    <Label>Email (optional)</Label>
                    <Input type="email" {...register("email")} placeholder="you@example.com" />
                    <FieldError>{errors.email?.message}</FieldError>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preferred Date</Label>
                      <Input type="date" {...register("preferredDate")} />
                      <FieldError>{errors.preferredDate?.message}</FieldError>
                    </div>
                    <div>
                      <Label>Preferred Time</Label>
                      <Input type="time" {...register("preferredTime")} />
                      <FieldError>{errors.preferredTime?.message}</FieldError>
                    </div>
                  </div>
                  <div>
                    <Label>Special Requests (optional)</Label>
                    <Textarea rows={3} {...register("specialRequests")} placeholder="Allergies, occasion, seating preference..." />
                  </div>

                  <p className="text-xs text-ivory/40 leading-relaxed">
                    No payment is required to reserve. Online payments are coming soon.
                  </p>

                  {mutation.isError && (
                    <p className="text-sm text-red-400">
                      {(mutation.error as Error)?.message ?? "Something went wrong. Please try again."}
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? "Sending..." : "Request Reservation"}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
