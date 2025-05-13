
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";

// Re-export the toast hook and function
export const useToast = useToastHook;
export const toast = toastFunction;
