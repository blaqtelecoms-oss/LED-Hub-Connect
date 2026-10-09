import React from "react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/ledUtils";

export default function MunicipalityLogo({ className = "" }) {
  return (
    <div className={`relative w-full max-w-[280px] aspect-[3/1] overflow-hidden rounded-lg shrink-0 ${className}`}>
      <Image
        src={LOGO_URL}
        alt="Newcastle Municipality logo"
        fittingType="fit"
        originWidth={1024}
        originHeight={684}
        className="absolute top-1/2 -translate-y-1/2 w-full aspect-[1024/684] object-contain"
      />
    </div>
  );
}