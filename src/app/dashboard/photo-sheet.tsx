"use client";

import { Sheet } from "@/components/sheet";
import { CameraCapture } from "./camera-capture";
import { CameraIcon, ImageIcon, TrashIcon } from "./icons";

export type PhotoSheetView = "menu" | "camera";

const optionClass =
  "ios-press flex h-14 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left text-[17px] font-medium text-slate-800 ring-1 ring-slate-200";

// "Change photo" bottom sheet: take a photo, choose a file, or remove the
// current one. On phones "Take a photo" hands off to the native camera; on
// desktop it swaps this sheet to a live webcam view.
export function PhotoSheet({
  open,
  view,
  hasPhoto,
  canTakePhoto,
  onClose,
  onTakePhoto,
  onChooseFile,
  onRemove,
  onCaptured,
}: {
  open: boolean;
  view: PhotoSheetView;
  hasPhoto: boolean;
  canTakePhoto: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFile: () => void;
  onRemove: () => void;
  onCaptured: (file: File) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={view === "camera" ? "Take a photo" : "Profile photo"}
      closeLabel="Close"
      scopeClass="admin-ui"
    >
      {view === "camera" ? (
        <CameraCapture onCapture={onCaptured} onUseFile={onChooseFile} />
      ) : (
        <div className="flex flex-col gap-2.5 pb-2">
          {canTakePhoto && (
            <button type="button" onClick={onTakePhoto} className={optionClass}>
              <CameraIcon className="h-5 w-5 text-brand-600" />
              Take a photo
            </button>
          )}
          <button type="button" onClick={onChooseFile} className={optionClass}>
            <ImageIcon className="h-5 w-5 text-brand-600" />
            Choose from files
          </button>
          {hasPhoto && (
            <button type="button" onClick={onRemove} className={`${optionClass} text-red-600`}>
              <TrashIcon className="h-5 w-5" />
              Remove photo
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
