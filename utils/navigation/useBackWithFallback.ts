import { usePathname, useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * Returns a back handler that pops when possible, but on a cold-start deep link
 * (nothing beneath the current screen) falls back to the relevant tab root so
 * the back control never becomes a no-op.
 */
export function useBackWithFallback(): () => void {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(
      pathname.includes("/saved/") ? "/(tabs)/saved" : "/(tabs)/explore",
    );
  }, [router, pathname]);
}
