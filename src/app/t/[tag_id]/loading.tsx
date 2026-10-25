// Profile placeholder in the iOS kit's own colours (.profile-ui), so a
// phone in dark mode doesn't flash a light skeleton before the card.
export default function Loading() {
  const bone = "rounded-2xl bg-ios-fill motion-safe:animate-pulse";
  return (
    <main className="profile-ui flex-1 bg-ios-bg" role="status" aria-busy="true">
      <span className="sr-only">Loading profile…</span>
      <div className="mx-auto w-full max-w-md">
        <div className={`h-[64svh] max-h-170 min-h-110 sm:mt-6 sm:rounded-4xl ${bone} rounded-none`} />
        <div className="flex flex-col gap-6 px-4 pt-5">
          <div className={`h-13 rounded-full ${bone}`} />
          <div className={`h-28 ${bone}`} />
          <div className={`h-36 ${bone}`} />
        </div>
      </div>
    </main>
  );
}
