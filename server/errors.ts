export class CapacityBelowConfirmedError extends Error {
  constructor(public confirmedGuestCount: number) {
    super(
      `Cannot reduce capacity below the confirmed guest count (${confirmedGuestCount} guests already hold seats).`,
    );
    this.name = "CapacityBelowConfirmedError";
  }
}
