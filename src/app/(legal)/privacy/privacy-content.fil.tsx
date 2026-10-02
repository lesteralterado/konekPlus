import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/constants";
import { LegalHeader, LegalList, LegalSection } from "../legal-content";

const UPDATED = "Setyembre 20, 2026";

// First-pass Filipino translation — see src/lib/i18n/dictionaries/fil.ts for
// the same note. Legal/policy text especially deserves a native-speaker
// proofread before this is treated as the authoritative Filipino version.
export function PrivacyContentFil() {
  return (
    <>
      <LegalHeader title="Patakaran sa Privacy" updated={UPDATED} updatedLabel="Huling na-update noong" />

      <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
        Ito ay salin sa Filipino ng aming Privacy Policy, para sa kaginhawahan ng
        pagbasa. Kung may hindi pagkakatugma sa pagitan ng bersyong ito at ng{" "}
        <Link href="/privacy" className="font-semibold underline underline-offset-2">
          orihinal na bersyong Ingles
        </Link>
        , ang bersyong Ingles ang susundin.
      </p>

      <p className="text-sm leading-relaxed text-slate-600">
        Ang Konek+ (&ldquo;kami,&rdquo; &ldquo;amin&rdquo;) ay nagbibigay ng NFC digital
        business card: isang physical card na nagbubukas ng public profile page kapag
        na-tap o na-scan, kasama ang isang dashboard kung saan mo pinapamahalaan ang
        makikita sa profile na iyon. Ipinapaliwanag ng patakarang ito kung anong data
        ang kinokolekta namin sa buong Konek+ web app at dashboard, paano namin ito
        ginagamit, at ang mga pagpipilian mong mayroon. Ito ay para sa mga may-ari ng
        card na may Konek+ account, at sa mga taong nag-tap o nag-scan lang ng Konek+
        card.
      </p>

      <LegalSection heading="1. Impormasyong kinokolekta namin">
        <p>
          <strong className="font-semibold text-brand-900">Impormasyon ng account.</strong>{" "}
          Kapag nag-sign up ka, ang aming authentication provider ay nag-iimbak ng
          iyong email address at isang secure na naka-hash na password &mdash; hinding-
          hindi namin iniimbak ang iyong password sa plain text at hindi na ito
          mababasa pabalik.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">
            Impormasyon ng profile na pinili mong i-publish.
          </strong>{" "}
          Lahat ng ilalagay mo sa iyong dashboard ay makikita sa iyong public profile
          &mdash; ikaw ang may kontrol kung ano eksaktong naroon:
        </p>
        <LegalList
          items={[
            "Pangalan, trabaho/posisyon, kumpanya, numero ng telepono, at email",
            "Isang tagline, bio, at isang custom na call-to-action button",
            "Listahan ng mga custom na link, at mga social handle na ikinonekta mo (Instagram, Facebook, TikTok, LinkedIn, X, Threads, Pinterest, at iba pa)",
            "Ang larawan ng iyong profile at anumang larawan, paglalarawan, at link ng portfolio project",
            "Ang napili mong profile template",
          ]}
        />
        <p>
          <strong className="font-semibold text-brand-900">
            Data ng card at pag-claim.
          </strong>{" "}
          Bawat physical card ay may maikli at natatanging code; ang pag-claim ng card
          ay nag-uugnay ng code na iyon sa iyong account. Ang card mismo ay nag-iimbak
          lamang ng code na iyon &mdash; walang personal na data na nakasulat sa NFC
          chip.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">
            Anonymous na bilang ng pagbisita.
          </strong>{" "}
          Kapag may nag-tap o nag-scan ng iyong card, ini-log namin ang code ng card at
          isang timestamp para maipakita sa iyo ang bilang ng view. Hindi namin
          ini-log ang IP address, impormasyon ng device, o pagkakakilanlan ng
          bisita &mdash; walang paraan para maiugnay ang isang view pabalik sa isang
          tao.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">
            Data ng device-trust login.
          </strong>{" "}
          Kung pipiliin mong tandaan ang isang device para sa mas mabilis na sign-in,
          nag-iimbak kami ng device identifier, isang opsyonal na label na ibinigay mo
          rito, at isang salted hash ng one-time PIN &mdash; hindi ang PIN mismo.
        </p>
        <p>
          <strong className="font-semibold text-brand-900">Mga order ng Keychain.</strong>{" "}
          Kung mag-order ka ng Social Media Keychain, kinokolekta namin ang pangalan ng
          customer, numero ng telepono/email na ibinigay mo, at ang mga social profile
          link na isinumite mo para maaari naming i-program ang keychain.
        </p>
      </LegalSection>

      <LegalSection heading="2. Paano namin ginagamit ang impormasyong ito">
        <LegalList
          items={[
            "Para patakbuhin at ipakita ang iyong public profile kapag na-tap o na-scan ang iyong card",
            "Para payagan kang makagawa ng “save to contacts” na vCard mula sa iyong profile",
            "Para ipakita sa iyo ang bilang ng view ng sarili mong card",
            "Para tuparin ang mga order ng physical card at keychain",
            "Para tumugon sa mga kahilingan ng suporta",
          ]}
        />
        <p>
          Hindi namin ibinebenta ang iyong personal na data, at hindi namin ginagamit
          ang laman ng iyong profile para sa advertising o ad targeting.
        </p>
      </LegalSection>

      <LegalSection heading="3. Sino ang makakakita ng ano">
        <p>
          Ang iyong public profile page ay, ayon sa disenyo, makikita ng kahit sinong
          nag-tap o nag-scan ng iyong card o may link nito &mdash; iyon mismo ang
          layunin ng produkto. Ikaw ang kumokontrol sa bawat field na lumalabas dito,
          at walang mapu-publish maliban kung ikaw mismo ang naglagay nito.
        </p>
        <p>
          Ang iyong email ng account, password, at dashboard ay pribado para sa iyo.
          Maa-access lamang ng mga administrator ng Konek+ ang data sa antas ng account
          kung kailangan para magbigay ng suporta o mag-imbestiga ng abuso, at sila
          mismo ay sakop din ng parehong database-level access controls na inilarawan
          sa ibaba &mdash; hindi lang isang app-level na login screen.
        </p>
      </LegalSection>

      <LegalSection heading="4. Paano namin pinoprotektahan ang iyong data">
        <LegalList
          items={[
            "Bawat table sa aming database ay nagpapatupad ng row-level security (RLS) sa antas ng database, hindi lang sa application, kaya ang isang request ay makakabasa o makakasulat lamang ng mga row na pinahihintulutan ito — hiwalay sa anumang bug sa app mismo",
            "Naka-encrypt ang data habang ipinapadala (TLS) sa pagitan ng iyong device, ng aming mga server, at ng aming database",
            "Naka-hash ang mga password ng account gamit ang aming authentication provider; ang mga device-trust PIN ay iniimbak lamang bilang salted hash",
            "Ang mga na-upload na larawan (avatar, portfolio) ay iniimbak sa access-scoped na storage na nakatali sa iyong account",
          ]}
        />
        <p>
          Hindi kami kasalukuyang certified sa ISO 27001 o SOC 2, at hindi namin
          aangkinin ang kabaligtaran. Ang aming mga infrastructure provider &mdash;
          Supabase at Vercel &mdash; ay may sarili nilang independiyenteng mga
          programa sa pagsunod bilang aming mga sub-processor; available ang mga
          detalye nang direkta mula sa mga provider na iyon. Ia-update namin ang
          seksyong ito kung at kapag nakumpleto na ng Konek+ mismo ang isang
          independiyenteng sertipikasyon.
        </p>
      </LegalSection>

      <LegalSection heading="5. Mga sub-processor na ginagamit namin">
        <LegalList
          items={[
            "Supabase — database, authentication, at file storage",
            "Vercel — pag-host ng application",
            "Cloudinary — pag-host ng larawan para sa site at marketing assets",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. Pagpapanatili ng data">
        <LegalList
          items={[
            "Iniingatan namin ang data ng iyong account at profile habang aktibo ang iyong account",
            "Ang pagbura ng iyong account ay nag-aalis ng iyong profile at mga portfolio item, at nag-aalis ng link sa anumang card mula rito (babalik ang mga ito sa unclaimed)",
            "Ang mga anonymous na rekord ng view count ay iniingatan sa aggregate at pana-panahong binubura; hindi kailanman maiuugnay ang mga ito pabalik sa pagkakakilanlan ng isang bisita dahil hindi kami kailanman nangolekta ng isa",
          ]}
        />
      </LegalSection>

      <LegalSection heading="7. Ang mga karapatan mo">
        <p>
          Depende sa kung saan ka nakatira, maaaring may karapatan kang i-access,
          itama, i-export, o burahin ang iyong personal na data, at tumutol o
          paghigpitan ang ilang pagproseso. Karamihan nito ay magagawa mo na mismo
          mula sa iyong dashboard &mdash; i-edit o alisin ang anumang profile field,
          burahin ang mga portfolio item, o i-download ang iyong vCard.
        </p>
        <p>
          Para sa iba pa, kabilang ang kumpletong pagbura ng account, makipag-ugnayan
          sa amin sa{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Kung ikaw ay nasa EU/UK, mayroon ka ring karapatang maghain ng reklamo sa
          iyong lokal na data protection authority.
        </p>
      </LegalSection>

      <LegalSection heading="8. Privacy ng mga bata">
        <p>
          Ang Konek+ ay hindi nakadirekta sa mga bata, at hindi namin sinasadyang
          kinokolekta ang data mula sa sinumang wala pang 16 taong gulang. Kung sa
          tingin mo ay may batang gumawa ng account, makipag-ugnayan sa amin at aalisin
          namin ito.
        </p>
      </LegalSection>

      <LegalSection heading="9. Internasyonal na paglipat ng data">
        <p>
          Maaaring iproseso at iimbak ng aming mga infrastructure provider ang data sa
          labas ng bansa kung saan ka naninirahan. Kung kinakailangan, umaasa kami sa
          mga pananggalang na inaalok ng mga provider na iyon para sa cross-border na
          paglipat.
        </p>
      </LegalSection>

      <LegalSection heading="10. Mga pagbabago sa patakarang ito">
        <p>
          Ia-update namin ang petsa sa itaas ng pahinang ito tuwing magbabago ang
          patakarang ito. Para sa mahahalagang pagbabago, gagawa kami ng makatwirang
          pagsisikap na direktang ipaalam sa mga may-ari ng account.
        </p>
      </LegalSection>

      <LegalSection heading="11. Makipag-ugnayan sa amin">
        <p>
          Mga tanong tungkol sa patakarang ito o sa iyong data:{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Tingnan din ang aming{" "}
          <Link href="/terms" className="font-medium text-brand-700 underline underline-offset-2">
            Mga Tuntunin ng Serbisyo
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
