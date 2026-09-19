import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/constants";
import { LegalHeader, LegalList, LegalSection } from "../legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy — Konek+",
  description: "How Konek+ collects, uses, and protects your data.",
};

const UPDATED = "September 20, 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalHeader title="Privacy Policy" updated={UPDATED} />

      <p className="text-sm leading-relaxed text-slate-600">
        Konek+ (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) provides NFC-enabled
        digital business cards: a physical card that opens a public profile page when
        tapped or scanned, plus a dashboard where you manage what that profile shows.
        This policy explains what data we collect across the Konek+ web app and
        dashboard, how we use it, and the choices you have. It applies both to card
        owners with a Konek+ account and to people who simply tap or scan a Konek+
        card.
      </p>

      <LegalSection heading="1. Information we collect">
        <p>
          <strong className="font-semibold text-brand-900">
            Account information.
          </strong>{" "}
          When you sign up, our authentication provider stores your email address and a
          securely hashed password &mdash; we never store your password in plain text
          and can&apos;t read it back.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">
            Profile information you choose to publish.
          </strong>{" "}
          Everything you fill in on your dashboard is visible on your public
          profile &mdash; you control exactly what&apos;s there:
        </p>
        <LegalList
          items={[
            "Name, job title, company, phone number, and email",
            "A tagline, a bio, and one custom call-to-action button",
            "A list of custom links, and social handles you connect (Instagram, Facebook, TikTok, LinkedIn, X, Threads, Pinterest, and others)",
            "Your profile photo and any portfolio project images, descriptions, and links",
            "Your chosen profile template",
          ]}
        />
        <p>
          <strong className="font-semibold text-brand-900">
            Card and claim data.
          </strong>{" "}
          Each physical card carries a short, unique code; claiming a card links that
          code to your account. The card itself stores only that code &mdash; no
          personal data is written to the NFC chip.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">
            Anonymous visit counts.
          </strong>{" "}
          When someone taps or scans your card, we log the card&apos;s code and a
          timestamp so we can show you a view count. We do not log the visitor&apos;s
          IP address, device information, or identity &mdash; there is nothing to tie
          a view back to a person.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">
            Device-trust login data.
          </strong>{" "}
          If you choose to remember a device for faster sign-in, we store a device
          identifier, an optional label you give it, and a salted hash of a one-time
          PIN &mdash; never the PIN itself.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">Keychain orders.</strong>{" "}
          If you order a Social Media Keychain, we collect the customer name,
          phone/email you provide, and the social profile links you submit so we can
          program the keychain.
        </p>
      </LegalSection>

      <LegalSection heading="2. How we use this information">
        <LegalList
          items={[
            "To operate and display your public profile when your card is tapped or scanned",
            "To let you generate a “save to contacts” vCard from your profile",
            "To show you your own card’s view counts",
            "To fulfill physical card and keychain orders",
            "To respond to support requests",
          ]}
        />
        <p>
          We do not sell your personal data, and we do not use your profile content
          for advertising or ad targeting.
        </p>
      </LegalSection>

      <LegalSection heading="3. Who can see what">
        <p>
          Your public profile page is, by design, visible to anyone who taps or scans
          your card or who has its link &mdash; that&apos;s the point of the product.
          You control every field that appears on it, and nothing is published unless
          you enter it yourself.
        </p>
        <p>
          Your account email, password, and dashboard are private to you. Konek+
          administrators can access account-level data only as needed to provide
          support or investigate abuse, and are themselves subject to the same
          database-level access controls described below &mdash; not just an
          app-level login screen.
        </p>
      </LegalSection>

      <LegalSection heading="4. How we protect your data">
        <LegalList
          items={[
            "Every table in our database enforces row-level security (RLS) at the database layer, not just in the application, so a request can only read or write rows it is authorized for — independent of any bug in the app itself",
            "Data is encrypted in transit (TLS) between your device, our servers, and our database",
            "Account passwords are hashed by our authentication provider; device-trust PINs are stored only as salted hashes",
            "Uploaded images (avatar, portfolio) are stored in access-scoped storage tied to your account",
          ]}
        />
        <p>
          We are not currently ISO 27001 or SOC 2 certified ourselves, and we won&apos;t
          claim otherwise. Our infrastructure providers &mdash; Supabase and Vercel
          &mdash; maintain their own independent compliance programs as our
          sub-processors; details are available directly from those providers. We will
          update this section if and when Konek+ itself completes an independent
          certification.
        </p>
      </LegalSection>

      <LegalSection heading="5. Sub-processors we use">
        <LegalList
          items={[
            "Supabase — database, authentication, and file storage",
            "Vercel — application hosting",
            "Cloudinary — image hosting for site and marketing assets",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. Data retention">
        <LegalList
          items={[
            "We keep your account and profile data for as long as your account is active",
            "Deleting your account removes your profile and portfolio items, and unlinks any cards from it (they revert to unclaimed)",
            "Anonymous view-count records are kept in aggregate and periodically pruned; they can never be tied back to a visitor’s identity because we never collected one",
          ]}
        />
      </LegalSection>

      <LegalSection heading="7. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct,
          export, or delete your personal data, and to object to or restrict certain
          processing. You can already do most of this yourself from your dashboard
          &mdash; edit or remove any profile field, delete portfolio items, or download
          your vCard.
        </p>
        <p>
          For anything else, including full account deletion, contact us at{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . If you&apos;re in the EU/UK, you also have the right to lodge a complaint
          with your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection heading="8. Children's privacy">
        <p>
          Konek+ is not directed to children, and we do not knowingly collect data
          from anyone under 16. If you believe a child has created an account, contact
          us and we&apos;ll remove it.
        </p>
      </LegalSection>

      <LegalSection heading="9. International data transfers">
        <p>
          Our infrastructure providers may process and store data outside your country
          of residence. Where required, we rely on the safeguards those providers
          offer for cross-border transfers.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to this policy">
        <p>
          We&apos;ll update the date at the top of this page whenever this policy
          changes. For material changes, we&apos;ll make reasonable efforts to notify
          account holders directly.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact us">
        <p>
          Questions about this policy or your data:{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . See also our{" "}
          <Link href="/terms" className="font-medium text-brand-700 underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
