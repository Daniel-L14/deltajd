"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export default function ProductPhoto({ src, name, className = "", compact = false }: {
  src?: string | null;
  name: string;
  className?: string;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState<string>();
  const showImage = src && src !== failed && /^(https:\/\/|blob:)/i.test(src);
  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-amber-400/15 delta-photo-surface ${className}`}>
      {showImage ? (
        <Image
          fill
          unoptimized
          src={src}
          alt={compact ? "" : name}
          onError={() => setFailed(src)}
          className="object-contain"
        />
      ) : (
        <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 text-gold-300/80">
          <ImageIcon aria-hidden className={compact ? "size-4" : "size-7 stroke-[1.25]"} />
          {!compact && <span className="text-xs tracking-wide">Foto pendiente</span>}
        </div>
      )}
    </div>
  );
}
