export type ToastType = "success" | "error" | "warning";

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message?: string;
  duration?: number;
}

type Listener = (options: ToastOptions) => void;

let listener: Listener | null = null;

export const subscribeToast = (fn: Listener): (() => void) => {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
};

export const showToast = (options: ToastOptions): void => {
  if (!listener) {
    console.warn(
      "[CustomToast] showToast() called before <ToastContainer /> was mounted.",
    );
    return;
  }
  listener(options);
};
