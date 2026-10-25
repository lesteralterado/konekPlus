"use client";

import { useEffect, useRef, useState } from "react";

// Live webcam capture for desktop browsers (phones use the native camera via
// <input capture> instead). Mounted only while the dialog is open, so the
// cleanup below always releases the camera — otherwise the browser's
// "camera in use" light would stay on after closing.
export function CameraCapture({
  onCapture,
  onUseFile,
}: {
  onCapture: (file: File) => void;
  onUseFile: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          for (const track of s.getTracks()) track.stop();
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          void video.play();
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setError(
          name === "NotAllowedError" || name === "SecurityError"
            ? "Camera access was blocked. Allow it in your browser's address bar, or choose a file instead."
            : name === "NotFoundError"
              ? "No camera was found on this device. Choose a file instead."
              : "We couldn't start the camera. Choose a file instead.",
        );
      });

    return () => {
      cancelled = true;
      if (stream) for (const track of stream.getTracks()) track.stop();
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], "camera.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  if (error) {
    return (
      <div className="pb-2">
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>
        <button
          type="button"
          onClick={onUseFile}
          className="ios-press mt-3 h-12 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white"
        >
          Choose a file
        </button>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <div className="relative overflow-hidden rounded-2xl bg-slate-900">
        {/* Mirrored like a selfie; the captured frame is not mirrored. */}
        <video
          ref={videoRef}
          playsInline
          muted
          onPlaying={() => setReady(true)}
          className="aspect-[4/3] w-full -scale-x-100 object-cover"
        />
        {!ready && (
          <p className="absolute inset-0 grid place-items-center text-sm text-white/70">
            Starting camera…
          </p>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        Your browser may ask for permission to use the camera.
      </p>
      <button
        type="button"
        onClick={capture}
        disabled={!ready}
        className="ios-press mt-3 h-12 w-full rounded-full bg-brand-900 text-[17px] font-semibold text-white disabled:opacity-50"
      >
        Take photo
      </button>
    </div>
  );
}
