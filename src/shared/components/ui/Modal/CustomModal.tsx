import { useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  slipeOpen?: string;
  alineItems?: string;
}

export default function CustomModal({
  isOpen,
  children,
  slipeOpen = "right",
  alineItems = "end",
}: CustomModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const animate =
    slipeOpen == "right" ? "animate-slide-in-right" : "animate-slide-in-left";
  const cardAline = alineItems === "end" ? "justify-end" : "justify-start";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex duration-700 ${animate} ${cardAline}`}
      style={{ backgroundColor: "#1018288C" }}
    >
      <div className="overflow-y-auto">{children}</div>
    </div>,
    document.body,
  );
}
