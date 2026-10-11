import Image from "next/image";
import { images } from "./images";

export function Showcase() {
  return (
    <section className="relative h-[50vh] max-h-[560px] min-h-[320px] w-full">
      <Image
        src={images.showcase}
        alt="A Konek+ card tapping a smartphone to share a profile over NFC"
        fill
        unoptimized
        className="object-cover"
      />
    </section>
  );
}
