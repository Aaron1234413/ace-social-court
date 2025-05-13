
import * as React from "react";
import { toast as sonnerToast } from "sonner";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "info" | "warning";
};

export type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick?: () => void;
  className?: string;
}>;

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success" | "info" | "warning";
};

type ToasterToast = Toast & {
  id: string;
  open: boolean;
  remove: () => void;
};

type UseToastReturnType = {
  toasts: ToasterToast[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
};

const TOAST_LIMIT = 20;

// Mutable array to store toasts
// Using a ref-like pattern but with a regular variable since we're not in a component
let toastStore: ToasterToast[] = [];

const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

function addToast(props: ToastProps): Toast {
  const id = props.id || generateId();

  const newToast: ToasterToast = {
    ...props,
    id,
    open: true,
    remove: () => removeToast(id),
  };

  // Update the store
  if (toastStore.length >= TOAST_LIMIT) {
    removeToast(toastStore[0].id);
  }
  toastStore = [...toastStore, newToast];

  // Trigger event to notify any listeners
  const event = new CustomEvent("toast-change", { detail: { toasts: toastStore } });
  window.dispatchEvent(event);

  return newToast;
}

function removeToast(id: string) {
  toastStore = toastStore.filter((t) => t.id !== id);
  
  // Trigger event to notify any listeners
  const event = new CustomEvent("toast-change", { detail: { toasts: toastStore } });
  window.dispatchEvent(event);
}

function useToast(): UseToastReturnType {
  const [state, setState] = React.useState<ToasterToast[]>(toastStore);

  React.useEffect(() => {
    const listener = (e: CustomEvent) => {
      setState(e.detail?.toasts || []);
    };
    window.addEventListener("toast-change" as any, listener as any);
    return () => window.removeEventListener("toast-change" as any, listener as any);
  }, []);

  return {
    toasts: state,
    toast: (props: ToastProps) => addToast(props),
    dismiss: (id: string) => removeToast(id),
  };
}

// Helper functions for showing different types of toasts
export function showSuccessToast(title: string, description?: string) {
  sonnerToast.success(title, {
    description
  });
}

export function showErrorToast(title: string, description?: string) {
  sonnerToast.error(title, {
    description
  });
}

export function showInfoToast(title: string, description?: string) {
  sonnerToast.info(title, {
    description
  });
}

export function showWarningToast(title: string, description?: string) {
  sonnerToast.warning(title, {
    description
  });
}

// Export the toast function from sonner directly to avoid type conflicts
export const toast = sonnerToast;

export { useToast };
