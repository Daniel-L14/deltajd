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
    <div className={`relative isolate overflow-hidden rounded-2xl border border-amber-400/15 bg-slate-950 ${className}`}>
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
        <div className="absolute inset-0 grid place-content-center justify-items-center gap-2 bg-gradient-to-br from-amber-400/10 via-slate-950 to-slate-900 text-amber-200/65">
          <ImageIcon aria-hidden className={compact ? "size-4" : "size-8"} />
          {!compact && <span className="text-xs">Foto pendiente</span>}
        </div>
      )}
    </div>
  );
}
