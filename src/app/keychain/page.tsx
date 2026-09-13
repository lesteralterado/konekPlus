import type { Metadata } from "next";
import { KeychainWizard } from "./keychain-wizard";

export const metadata: Metadata = {
  title: "Konek+ Social Media Keychain",
  description:
    "Choose the social media accounts you want to connect to your Konek+ Keychain.",
};

// Public, unauthenticated landing page — the destination of the one common
// QR code from brief §1/§2. Mobile-first, no login: a customer scans, picks
// platforms, pastes their profile links, and submits. All step state lives
// in the client wizard; this page just provides the shell.
export default function KeychainPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <KeychainWizard />
    </div>
  );
}
