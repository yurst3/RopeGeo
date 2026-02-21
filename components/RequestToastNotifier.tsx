import { useEffect, useRef } from "react";
import Toast from "react-native-toast-message";

const TOAST_DURATION_MS = 5000;

function showSuccessToast(message: string, topOffset: number) {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    position: "top",
    visibilityTime: TOAST_DURATION_MS,
    autoHide: true,
    topOffset,
  });
}

function showErrorToast(message: string, topOffset: number) {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message,
    position: "top",
    visibilityTime: TOAST_DURATION_MS,
    autoHide: true,
    topOffset,
  });
}

export type RequestToastNotifierProps<T> = {
  /** True while the request is in flight. Resets success/error toast state when it becomes true. */
  loading: boolean;
  /** Response data when the request succeeds. Used only to decide when to show the success toast. */
  data: T | null;
  /** Error when the request fails. Shown as an error toast. */
  errors: Error | null;
  /**
   * Message for the success toast. If a function, it receives the loaded data (e.g. to include a count).
   * Omit or pass undefined to skip the success toast.
   */
  successMessage?: string | ((data: T) => string);
  /** Offset from the top of the screen (e.g. safe area inset) for toast position. */
  topOffset: number;
};

/**
 * Shows a success toast when a request finishes with data and an error toast when it fails.
 * Toasts are shown at most once per "request" (resets when loading becomes true).
 * Use on any screen that has async loading state.
 */
export function RequestToastNotifier<T>({
  loading,
  data,
  errors,
  successMessage,
  topOffset,
}: RequestToastNotifierProps<T>) {
  const hasToastedSuccess = useRef(false);
  const hasToastedError = useRef(false);

  if (loading) {
    hasToastedSuccess.current = false;
    hasToastedError.current = false;
  }

  useEffect(() => {
    if (successMessage == null || loading || data == null || hasToastedSuccess.current) {
      return;
    }
    hasToastedSuccess.current = true;
    const message =
      typeof successMessage === "function" ? successMessage(data) : successMessage;
    showSuccessToast(message, topOffset);
  }, [loading, data, successMessage, topOffset]);

  useEffect(() => {
    if (errors == null || hasToastedError.current) {
      return;
    }
    hasToastedError.current = true;
    showErrorToast(errors.message, topOffset);
  }, [errors, topOffset]);

  return null;
}
