import React, { useCallback, useEffect, useRef, useState } from "react";
import { subscribeToast, type ToastOptions, type ToastType } from "./UseToast";
import IconRenderer from "../IconRender/IconRenderer";

interface ToastState extends ToastOptions {
  key: number;
}

const TOAST_CONFIG: Record<
  ToastType,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    icon: "check" | "cross" | "exclaim";
  }
> = {
  success: {
    border: "border-success",
    iconBg: "bg-emerald-100",
    iconColor: "bg-success",
    titleColor: "text-success",
    icon: "check",
  },
  error: {
    border: "border-danger",
    iconBg: "bg-red-100",
    iconColor: "bg-danger",
    titleColor: "text-danger",
    icon: "cross",
  },
  warning: {
    border: "border-warning",
    iconBg: "bg-amber-100",
    iconColor: "bg-warning",
    titleColor: "text-warning",
    icon: "exclaim",
  },
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const config = TOAST_CONFIG[type];
  return (
    <div
      className={`flex h-[48px] w-[48px]  items-center justify-center rounded-full ${config.iconBg}`}
    >
      {config.icon === "check" && (
        <IconRenderer icon="FiCheckCircle" size={22} className="text-success" />
      )}
      {config.icon === "cross" && (
        <IconRenderer
          icon="FaRegTimesCircle"
          size={22}
          className="text-danger"
        />
      )}
      {config.icon === "exclaim" && (
        <IconRenderer icon="IoIosWarning" size={22} className="text-warning" />
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterFrame = useRef<number | null>(null);

  const hideToast = useCallback(() => {
    setVisible(false);
    unmountTimer.current = setTimeout(() => setToast(null), 250); // matches duration-300 below
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToast(
      ({ type = "success", title, message, duration = 3000 }) => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        if (unmountTimer.current) clearTimeout(unmountTimer.current);
        if (enterFrame.current) cancelAnimationFrame(enterFrame.current);

        setVisible(false);
        setToast({ type, title, message, duration, key: Date.now() });

        enterFrame.current = requestAnimationFrame(() => {
          enterFrame.current = requestAnimationFrame(() => setVisible(true));
        });

        hideTimer.current = setTimeout(hideToast, duration);
      },
    );

    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
      if (enterFrame.current) cancelAnimationFrame(enterFrame.current);
    };
  }, [hideToast]);

  if (!toast) return null;

  const config = TOAST_CONFIG[toast.type ?? "success"];

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[9999]  min-w-[329px] px-4 sm:px-0 mb-20 mr-20">
      <div
        className={`h-[100px] shadow-card-xl pointer-events-auto flex items-center rounded-6 border-l-[5px] bg-white p-3.5 shadow-black/10 transition-all duration-300 ease-out ${
          config.border
        } ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
      >
        <ToastIcon type={toast.type ?? "success"} />

        <div className="min-w-0 flex-1 px-3">
          {!!toast.title && (
            <div
              className={`truncate text-[15px] font-bold ${config.titleColor}`}
            >
              {toast.title}
            </div>
          )}
          {!!toast.message && (
            <div className="truncate text-[13px] text-gray-500">
              {toast.message}
            </div>
          )}
        </div>

        <button
          onClick={hideToast}
          aria-label="Close"
          className="ml-1 p-1.5 leading-none"
        >
          <IconRenderer icon="IoMdClose" size={20} color="#A8A8AD" />
        </button>
      </div>
    </div>
  );
};
