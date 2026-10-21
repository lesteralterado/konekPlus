// Couriers offered in the admin "mark shipped" form. The name is what gets
// stored on the order; trackUrl builds a public tracking link for it.
export const COURIERS = [
  {
    name: "J&T Express",
    trackUrl: (n: string) =>
      `https://www.jtexpress.ph/trajectoryQuery?waybillNo=${encodeURIComponent(n)}`,
  },
  {
    name: "LBC",
    trackUrl: (n: string) =>
      `https://www.lbcexpress.com/track/?tracking_no=${encodeURIComponent(n)}`,
  },
  { name: "Other", trackUrl: null },
] as const;

export function courierTrackingUrl(courier: string | null, trackingNumber: string | null) {
  if (!courier || !trackingNumber) return null;
  const match = COURIERS.find((c) => c.name === courier);
  return match?.trackUrl ? match.trackUrl(trackingNumber) : null;
}
