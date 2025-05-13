
import { useToast as useToastHook, toast as toastFunction, showSuccessToast, showErrorToast } from "@/hooks/use-toast";

// Re-export the toast hook and function
export const useToast = useToastHook;
export const toast = toastFunction;
export { showSuccessToast, showErrorToast };
