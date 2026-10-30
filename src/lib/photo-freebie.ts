// The thank-you for agreeing to a handover photo. Not decided yet, so this is
// the one place to change it: today it only RECORDS that a freebie is owed
// (customer_photos.freebie_status) and what was actually given (a free-text
// note), so nothing about it is promised to customers before it's confirmed.
//
// Options once decided: Pro months (card owners only — keychain buyers have
// no account), a small physical item (log its cost as a "marketing" expense
// on /admin/finance), or a discount code.
export const PHOTO_FREEBIE = {
  // Off → photos are still saved, but no freebie is tracked.
  enabled: true,
  // What staff see in the photo sheet. Never shown to customers.
  label: "a small thank-you gift",

  // Card owners sending their own photo from the dashboard. OFF until the
  // freebie is decided: while it's off, no customer sees the offer, so
  // nobody is promised a gift that hasn't been chosen. (Customers who already
  // sent a photo still see its status, and can remove it.)
  offerToCustomers: false,
  // What the customer-facing offer says they get. Change together with
  // `label` once the freebie is decided; keep it true to what you give.
  customerText: "a thank-you gift",
};
