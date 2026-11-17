"use client";

import { useEffect, useId, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import ProductPhoto from "@/app/components/productos/ProductPhoto";
import { PHOTO_TYPES, PHOTO_LIMIT } from "@/lib/photo-settings";

export default function ProductPhotoPicker({ name, current, file, disabled, onChange, onPublish }: {
  name: string;
  current?: string | null;
  file: File | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
  onPublish?: () => void;
}) {
  const id = useId();
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const frame = requestAnimationFrame(() => setPreview(url));
    return () => {
      cancelAnimationFrame(frame);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function select(files: FileList | null) {
    if (disabled || !files?.length) return;
    const image = files[0];
    if (files.length !== 1 || !PHOTO_TYPES.includes(image.type) || !image.size || image.size > PHOTO_LIMIT) {
      setError("Selecciona un solo JPG, PNG o WebP de hasta 4 MB.");
      return;
    }
    setError("");
    onChange(image);
  }

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4 rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-400/5 to-slate-950 p-5">
      <div className="flex items-center gap-3">
        <ImagePlus aria-hidden className="size-5 text-amber-300" />
        <h3 id={`${id}-title`} className="text-lg font-semibold text-slate-50">Fotografía del perfume</h3>
      </div>
      <ProductPhoto src={file ? preview : current} name={name || "Vista previa del perfume"} className="aspect-[4/3] w-full" />
      <label
        onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files); }}
        className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-3 py-5 text-center text-sm transition-colors focus-within:outline-2 focus-within:outline-amber-300 ${disabled ? "opacity-60" : "cursor-pointer"} ${dragging ? "border-amber-300 bg-amber-400/15" : "border-amber-400/35 hover:bg-amber-400/10"}`}
      >
        <UploadCloud aria-hidden className="size-6 text-amber-300" />
        <span className="font-medium">{file ? "Elegir otra foto" : "Arrastra o selecciona una foto"}</span>
        <span id={`${id}-help`} className="text-xs text-slate-400">JPG, PNG o WebP · Máximo 4 MB</span>
        <input
          type="file"
          accept={PHOTO_TYPES.join(",")}
          aria-describedby={`${id}-help`}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => { select(event.currentTarget.files); event.currentTarget.value = ""; }}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {file && (
        <div className="space-y-3">
          <p role="status" className="break-all text-sm text-amber-200">{file.name}</p>
          <div className="flex flex-wrap gap-2">
            {onPublish && <button type="button" className="delta-button" onClick={onPublish} disabled={disabled}>{disabled ? "Guardando…" : "Guardar solo la foto"}</button>}
            <button type="button" className="delta-secondary inline-flex items-center gap-2" disabled={disabled} onClick={() => { setError(""); onChange(null); }}>
              <X aria-hidden className="size-4" /> Retirar selección
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
