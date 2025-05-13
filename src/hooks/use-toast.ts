
import React from "react";

type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick?: () => void;
  className?: string;
}>;

interface Toast extends ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
}

const TOAST_REMOVE_DELAY = 3000;

type ToasterToast = Toast & {
  open: boolean;
  remove: () => void;
};

type ToasterState = {
  toasts: ToasterToast[];
};

const toasterState: ToasterState = {
  toasts: [],
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Functions to actually store and remove toasts
function addToast(props: ToastProps): Toast {
  const id = props.id || generateId();

  const newToast: ToasterToast = {
    ...props,
    id,
    open: true,
    remove: () => removeToast(id),
  };

  // Update the state
  toasterState.toasts = [...toasterState.toasts, newToast];

  // Dispatch event so any listeners can update
  dispatchToastEvent();

  return newToast;
}

function removeToast(id: string) {
  // Update the state
  toasterState.toasts = toasterState.toasts.map((toast) =>
    toast.id === id
      ? {
          ...toast,
          open: false,
        }
      : toast
  );

  // Dispatch event so any listeners can update
  dispatchToastEvent();

  // Actually remove the toast after delay
  setTimeout(() => {
    toasterState.toasts = toasterState.toasts.filter((t) => t.id !== id);
    dispatchToastEvent();
  }, TOAST_REMOVE_DELAY);
}

const listeners: Array<(state: ToasterState) => void> = [];

// Dispatch event to listeners
function dispatchToastEvent() {
  listeners.forEach((listener) => {
    listener(toasterState);
  });
}

// Hook to use the toast functionality
export function useToast() {
  const [state, setState] = React.useState<ToasterState>(toasterState);

  React.useEffect(() => {
    const listener = (newState: ToasterState) => {
      setState({ ...newState });
    };

    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toast: (props: ToastProps) => addToast(props),
    toasts: state.toasts,
    dismiss: (id: string) => removeToast(id),
  };
}

// Helper functions for showing different types of toasts
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "default",
  });
}

export function showErrorToast(title: string, description?: string) {
  toast({
    title,
    description,
    variant: "destructive",
  });
}

// Standalone toast function
export const toast = {
  dismiss: (id: string) => removeToast(id),
  success: (title: string, props?: Omit<ToastProps, "title" | "variant">) =>
    addToast({ title, variant: "default", ...props }),
  error: (title: string, props?: Omit<ToastProps, "title" | "variant">) =>
    addToast({ title, variant: "destructive", ...props }),
  warning: (title: string, props?: Omit<ToastProps, "title" | "variant">) =>
    addToast({ title, variant: "default", ...props }),
  info: (title: string, props?: Omit<ToastProps, "title" | "variant">) =>
    addToast({ title, variant: "default", ...props }),
};
