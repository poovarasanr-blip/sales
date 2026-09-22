import { useEffect } from "react";
import { createPortal } from "react-dom";

interface LoaderModalProps {
  isOpen: boolean;
  message?: string;
}

export default function LoaderModal({
  isOpen,
  message = "Processing...",
}: LoaderModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(16, 24, 40, 0.55)" }}
    >
      <div className="bg-white rounded-12 px-32 py-24 flex flex-col items-center gap-16 shadow-xl">
        <div className="w-10 h-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-14 font-medium text-darkgray">{message}</p>
      </div>
    </div>,
    document.body,
  );
}
