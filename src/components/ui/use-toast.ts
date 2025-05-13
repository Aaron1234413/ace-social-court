
import { 
  useToast as useToastHook, 
  toast,
  showSuccessToast, 
  showErrorToast, 
  showInfoToast,
  showWarningToast 
} from "@/hooks/use-toast";

// Re-export the toast hook and functions
export const useToast = useToastHook;
export { 
  toast, 
  showSuccessToast, 
  showErrorToast, 
  showInfoToast,
  showWarningToast 
};
