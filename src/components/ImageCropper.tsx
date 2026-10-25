import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui";
import { useModal } from "../lib/useModal";

export default function ImageCropper({
  source,
  onClose,
  onApply,
}: {
  source: string;
  onClose: () => void;
  onApply: (file: File) => void;
}) {
  const image = useRef<HTMLImageElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    mounted = useRef(true);
  const [loaded, setLoaded] = useState(false),
    [zoom, setZoom] = useState(1),
    [x, setX] = useState(50),
    [y, setY] = useState(50),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  useModal(true, onClose);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function region() {
    const photo = image.current!;
    const side = Math.max(
      1,
      Math.min(photo.naturalWidth, photo.naturalHeight) / zoom,
    );
    return {
      side,
      left: ((photo.naturalWidth - side) * x) / 100,
      top: ((photo.naturalHeight - side) * y) / 100,
    };
  }
  useEffect(() => {
    if (!loaded || !canvas.current || !image.current) return;
    const { side, left, top } = region();
    canvas.current
      .getContext("2d")
      ?.drawImage(image.current, left, top, side, side, 0, 0, 280, 280);
  }, [loaded, zoom, x, y]);
  function apply() {
    if (!loaded || !image.current || saving) return;
    setSaving(true);
    setError("");
    const { side, left, top } = region(),
      output = document.createElement("canvas");
    output.width = output.height = Math.min(1024, Math.round(side));
    const context = output.getContext("2d");
    if (!context) {
      setSaving(false);
      setError("Cropping is unavailable. Use the original photo.");
      return;
    }
    context.drawImage(
      image.current,
      left,
      top,
      side,
      side,
      0,
      0,
      output.width,
      output.height,
    );
    output.toBlob(
      (blob) => {
        output.width = output.height = 0;
        if (!mounted.current) return;
        if (!blob) {
          setSaving(false);
          setError("Could not crop this photo. Try a different image.");
          return;
        }
        onApply(new File([blob], "cropped-item.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="row between">
          <h2 id="crop-title">Focus on one item</h2>
          <button
            className="icon-button"
            aria-label="Close crop dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          Keep the whole item visible. A clear crop can reduce background
          distractions.
        </p>
        <img
          ref={image}
          src={source}
          alt="Original photo to crop"
          hidden
          onLoad={() => setLoaded(true)}
          onError={() => setError("Could not read this image.")}
        />
        <canvas
          ref={canvas}
          width={280}
          height={280}
          aria-label="Preview of the selected square crop"
        />
        {[
          {
            label: "Zoom",
            value: zoom,
            set: setZoom,
            min: 1,
            max: 3,
            step: 0.1,
          },
          {
            label: "Horizontal position",
            value: x,
            set: setX,
            min: 0,
            max: 100,
            step: 1,
          },
          {
            label: "Vertical position",
            value: y,
            set: setY,
            min: 0,
            max: 100,
            step: 1,
          },
        ].map((control) => (
          <label key={control.label} className="crop-control">
            {control.label}
            <input
              type="range"
              aria-label={control.label}
              min={control.min}
              max={control.max}
              step={control.step}
              value={control.value}
              disabled={!loaded || saving}
              onChange={(event) => control.set(Number(event.target.value))}
            />
          </label>
        ))}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <p className="footnote">
          Cropping and classification stay on your device. Cropping does not
          establish material or safety.
        </p>
        <div className="row wrap">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!loaded || saving} onClick={apply}>
            {saving ? "Cropping…" : "Use this crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}
