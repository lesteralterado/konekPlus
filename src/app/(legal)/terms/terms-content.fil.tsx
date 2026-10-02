import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/constants";
import { LegalHeader, LegalList, LegalSection } from "../legal-content";

const UPDATED = "Setyembre 20, 2026";

// First-pass Filipino translation — worth a native-speaker proofread
// before this is treated as the authoritative Filipino version.
export function TermsContentFil() {
  return (
    <>
      <LegalHeader
        title="Mga Tuntunin ng Serbisyo"
        updated={UPDATED}
        updatedLabel="Huling na-update noong"
      />

      <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
        Ito ay salin sa Filipino ng aming Terms of Service, para sa kaginhawahan ng
        pagbasa. Kung may hindi pagkakatugma sa pagitan ng bersyong ito at ng{" "}
        <Link href="/terms" className="font-semibold underline underline-offset-2">
          orihinal na bersyong Ingles
        </Link>
        , ang bersyong Ingles ang susundin.
      </p>

      <p className="text-sm leading-relaxed text-slate-600">
        Ang mga Tuntunin ng Serbisyong ito (&ldquo;Mga Tuntunin&rdquo;) ay namamahala
        sa iyong paggamit ng Konek+ &mdash; ang website, dashboard, physical na NFC
        card, at mga kaugnay na serbisyo (sama-sama, ang &ldquo;Serbisyo&rdquo;). Sa
        paggawa ng account, pag-claim ng card, o sa ibang paraan paggamit ng Serbisyo,
        sumasang-ayon ka sa mga Tuntuning ito.
      </p>

      <LegalSection heading="1. Ang serbisyo">
        <p>
          Nagbibigay ang Konek+ ng physical na NFC/QR card na naka-link sa isang
          public profile page na kontrolado mo mula sa isang dashboard. Ang pag-edit
          ng iyong profile ay agad na nag-a-update sa bawat card na naka-link dito,
          nang hindi na kailangang i-program muli ang card mismo.
        </p>
      </LegalSection>

      <LegalSection heading="2. Ang iyong account">
        <p>
          Dapat kang magbigay ng tamang impormasyon kapag gumagawa ng account at
          panatilihing ligtas ang iyong mga login credential. Responsable ka sa
          anumang aktibidad na nangyayari sa ilalim ng iyong account.
        </p>
        <p>
          Isang account lamang ang maaaring mag-claim at mamahala ng maraming card.
          Bawat card ay dapat i-claim ng nilalayon nitong may-ari gamit ang code na
          nakalimbag dito.
        </p>
      </LegalSection>

      <LegalSection heading="3. Ang iyong nilalaman">
        <p>
          Pag-aari mo ang nilalamang ina-upload o inilalagay mo &mdash; mga larawan,
          bio, link, portfolio item, at lahat ng iba pa sa iyong profile. Sa
          pag-publish nito, binibigyan mo ang Konek+ ng lisensyang kailangan para
          i-host, iimbak, at ipakita ito bilang bahagi ng Serbisyo &mdash; wala nang
          iba pa.
        </p>
        <p>
          Responsable kang tiyakin na may karapatan ka sa anumang ina-upload mo, at na
          ang nilalaman ng iyong profile ay hindi lumalabag sa karapatan ng iba o sa
          naaangkop na batas.
        </p>
      </LegalSection>

      <LegalSection heading="4. Katanggap-tanggap na paggamit">
        <p>Sumasang-ayon kang hindi gagamitin ang Serbisyo para:</p>
        <LegalList
          items={[
            "Mag-publish ng ilegal, mapanlinlang, o lumalabag na nilalaman",
            "Magpanggap bilang ibang tao o negosyo",
            "Mangalap, mag-scrape, o magbenta ng data ng ibang user",
            "Subukang laktawan ang card-claim, authentication, o access controls",
            "Mag-upload ng malware o nilalamang lumalabag sa naaangkop na batas",
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. Mga physical na card">
        <p>
          Ang isang card ay may dala lamang na maikling code; walang personal na data
          na naka-imbak sa chip mismo. Kung nawala o ninakaw ang isang card,
          makipag-ugnayan sa amin at ia-unlink namin ito mula sa iyong profile para
          hindi na ito maglalabas ng iyong impormasyon, at pagkatapos ay tutulungan ka
          naming mag-claim ng kapalit.
        </p>
        <p>
          Inilalaan namin ang karapatang i-disable ang isang card na iniulat na nawala,
          inabuso, o ginamit para labagin ang mga Tuntuning ito.
        </p>
      </LegalSection>

      <LegalSection heading="6. Availability ng serbisyo">
        <p>
          Nilalayon naming panatilihing available ang Serbisyo ngunit hindi namin
          ginagarantiyahan ang walang-tigil na access. Maaaring kailanganin naming
          i-suspinde o baguhin ang mga feature para sa maintenance, seguridad, o
          mga pagpapabuti.
        </p>
      </LegalSection>

      <LegalSection heading="7. Pagwawakas">
        <p>
          Maaari mong burahin ang iyong account kahit kailan, na nag-aalis ng iyong
          data ng profile at nag-aalis ng link sa iyong mga card. Maaari naming
          i-suspinde o wakasan ang mga account na lumalabag sa mga Tuntuning ito,
          partikular na sa seksyon ng Katanggap-tanggap na Paggamit sa itaas.
        </p>
      </LegalSection>

      <LegalSection heading="8. Mga disclaimer at limitasyon ng pananagutan">
        <p>
          Ibinibigay ang Serbisyo nang &ldquo;as is.&rdquo; Hanggang sa pinapayagan ng
          batas, itinatanggi ng Konek+ ang anumang uri ng warranty at hindi mananagot
          para sa hindi direkta, aksidente, o kahihinatnang pinsalang nagmumula sa
          iyong paggamit ng Serbisyo.
        </p>
      </LegalSection>

      <LegalSection heading="9. Mga pagbabago sa mga tuntuning ito">
        <p>
          Maaari naming i-update ang mga Tuntuning ito paminsan-minsan. Ang
          pagpapatuloy ng paggamit ng Serbisyo matapos magkabisa ang mga pagbabago ay
          nangangahulugang tinatanggap mo ang na-update na mga Tuntunin.
        </p>
      </LegalSection>

      <LegalSection heading="10. Namamahalang batas">
        <p>
          Ang mga Tuntuning ito ay pinamamahalaan ng mga batas na naaangkop sa lugar
          ng legal na pagtatatag ng Konek+, nang walang pagsasaalang-alang sa mga
          prinsipyo ng conflict-of-law.
        </p>
      </LegalSection>

      <LegalSection heading="11. Makipag-ugnayan sa amin">
        <p>
          Mga tanong tungkol sa mga Tuntuning ito:{" "}
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="font-medium text-brand-700 underline underline-offset-2"
          >
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Tingnan din ang aming{" "}
          <Link href="/privacy" className="font-medium text-brand-700 underline underline-offset-2">
            Patakaran sa Privacy
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}
