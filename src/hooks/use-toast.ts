
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
const TOAST_REMOVE_DELAY = 1000;

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const actionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const toasts = React.createRef<ToasterToast[]>();
if (!toasts.current) {
  toasts.current = [];
}

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

  // Update the state
  if (toasts.current) {
    if (toasts.current.length >= TOAST_LIMIT) {
      removeToast(toasts.current[0].id);
    }
    toasts.current = [...toasts.current, newToast];
  }

  return newToast;
}

function removeToast(id: string) {
  if (toastTimeouts.has(id)) {
    clearTimeout(toastTimeouts.get(id));
    toastTimeouts.delete(id);
  }

  if (actionTimeouts.has(id)) {
    clearTimeout(actionTimeouts.get(id));
    actionTimeouts.delete(id);
  }

  if (toasts.current) {
    toasts.current = toasts.current.filter((t) => t.id !== id);
  }
}

function useToast(): UseToastReturnType {
  const [state, setState] = React.useState<ToasterToast[]>([]);

  React.useEffect(() => {
    if (toasts.current) {
      setState(toasts.current);
      const listener = () => {
        setState([...toasts.current!]);
      };
      window.addEventListener("toast-change", listener);
      return () => window.removeEventListener("toast-change", listener);
    }
    return undefined;
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
