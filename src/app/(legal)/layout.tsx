import type { ReactNode } from "react";
import { SiteChrome } from "../site-chrome";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">{children}</div>
    </SiteChrome>
  );
}
