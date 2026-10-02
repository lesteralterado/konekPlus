import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/constants";
import { LegalHeader, LegalList, LegalSection } from "../legal-content";

const UPDATED = "September 20, 2026";

export function TermsContentEn() {
  return (
    <>
      <LegalHeader title="Terms of Service" updated={UPDATED} />

      <p className="text-sm leading-relaxed text-slate-600">
        These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Konek+
        &mdash; the website, dashboard, physical NFC cards, and related services
        (together, the &ldquo;Service&rdquo;). By creating an account, claiming a
        card, or otherwise using the Service, you agree to these Terms.
      </p>

      <LegalSection heading="1. The service">
        <p>
          Konek+ provides a physical NFC/QR card that links to a public profile page
          you control from a dashboard. Editing your profile updates every card
          linked to it instantly, without reprogramming the card itself.
        </p>
      </LegalSection>

      <LegalSection heading="2. Your account">
        <p>
          You must provide accurate information when creating an account and keep
          your login credentials secure. You&apos;re responsible for activity that
          happens under your account.
        </p>
        <p>
          One account may claim and manage multiple cards. Each card must be claimed
          by its intended owner using the code printed on it.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your content">
        <p>
          You own the content you upload or enter &mdash; photos, bio, links,
          portfolio items, and everything else on your profile. By publishing it, you
          grant Konek+ the license needed to host, store, and display it as part of
          the Service &mdash; nothing more.
        </p>
        <p>
          You&apos;re responsible for making sure you have the rights to anything you
          upload, and that your profile content doesn&apos;t violate anyone else&apos;s
          rights or applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>You agree not to use the Service to:</p>
        <LegalList
          items={[
            "Publish illegal, fraudulent, or infringing content",
            "Impersonate another person or business",
            "Harvest, scrape, or resell other users’ data",
            "Attempt to bypass card-claim, authentication, or access controls",
            "Upload malware or content that violates applicable law",
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. Physical cards">
        <p>
          A card carries only a short code; it stores no personal data on the chip
          itself. If a card is lost or stolen, contact us and we&apos;ll unlink it
          from your profile so it stops resolving to your information, then help you
          claim a replacement.
        </p>
        <p>
          We reserve the right to disable a card that&apos;s reported lost, abused, or
          used to violate these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="6. Service availability">
        <p>
          We aim to keep the Service available but don&apos;t guarantee uninterrupted
          access. We may need to suspend or modify features for maintenance,
          security, or improvements.
        </p>
      </LegalSection>

      <LegalSection heading="7. Termination">
        <p>
          You may delete your account at any time, which removes your profile data
          and unlinks your cards. We may suspend or terminate accounts that violate
          these Terms, in particular the Acceptable Use section above.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers &amp; limitation of liability">
        <p>
          The Service is provided &ldquo;as is.&rdquo; To the extent permitted by law,
          Konek+ disclaims warranties of any kind and is not liable for indirect,
          incidental, or consequential damages arising from your use of the Service.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service
          after changes take effect means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="10. Governing law">
        <p>
          These Terms are governed by the laws applicable to Konek+&apos;s place of
          legal establishment, without regard to conflict-of-law principles.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact us">
        <p>
          Questions about these Terms:{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . See also our{" "}
          <Link href="/privacy" className="font-medium text-brand-700 underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
