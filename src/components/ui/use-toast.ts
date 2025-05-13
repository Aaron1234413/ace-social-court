
import { 
  useToast as useToastHook, 
  toast as toastFunction, 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast,
  showWarningToast 
} from "@/hooks/use-toast";

// Re-export the toast hook and functions
export const useToast = useToastHook;
export const toast = toastFunction;
export { 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast,
  showWarningToast 
};
