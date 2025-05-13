
import * as React from "react";
import { toast as sonnerToast } from "sonner";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
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

// Using a ref pattern for the toast store
const toastStore = {
  data: [] as ToasterToast[],
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  notify() {
    this.listeners.forEach((listener) => listener());
  },
  update(toasts: ToasterToast[]) {
    this.data = toasts;
    this.notify();
  },
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

function addToast(props: ToastProps): Toast {
  const id = props.id || generateId();

  // Ensure action is a valid React element or undefined
  const safeAction = props.action && React.isValidElement(props.action) 
    ? props.action as ToastActionElement 
    : undefined;

  const newToast: ToasterToast = {
    ...props,
    id,
    action: safeAction,
    open: true,
    remove: () => removeToast(id),
  };

  // Update the store
  if (toastStore.data.length >= TOAST_LIMIT) {
    removeToast(toastStore.data[0].id);
  }
  
  toastStore.update([...toastStore.data, newToast]);
  return newToast;
}

function removeToast(id: string) {
  toastStore.update(toastStore.data.filter((t) => t.id !== id));
}

function useToast(): UseToastReturnType {
  const [state, setState] = React.useState<ToasterToast[]>(toastStore.data);

  React.useEffect(() => {
    const unsubscribe = toastStore.subscribe(() => {
      setState([...toastStore.data]);
    });
    return unsubscribe;
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
