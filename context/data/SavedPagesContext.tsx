import { deleteOfflineBundleFiles } from "@/utils/offline/deleteOfflineBundle";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type OnlineRopewikiPageView,
  SavedPage,
  SAVED_PAGES_STORAGE_KEY,
} from "ropegeo-common/models";

type SavedPagesContextValue = {
  savedEntries: SavedPage[];
  isLoading: boolean;
  isSaved: (pageId: string) => boolean;
  addSaved: (entry: SavedPage) => void;
  replaceSaved: (entry: SavedPage) => void;
  removeSaved: (pageId: string) => void;
  removeDownloadBundle: (pageId: string) => Promise<void>;
  toggleSaveFromRopewikiPage: (data: OnlineRopewikiPageView) => void;
  refreshFromStorage: () => Promise<void>;
};

const SavedPagesContext = createContext<SavedPagesContextValue | null>(null);

async function loadEntries(): Promise<SavedPage[]> {
  const raw = await AsyncStorage.getItem(SAVED_PAGES_STORAGE_KEY);
  if (raw == null || raw === "") return [];
  let outer: unknown;
  try {
    outer = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
  if (outer == null || typeof outer !== "object") {
    return [];
  }
  if (Array.isArray(outer)) {
    return [];
  }
  const map = outer as Record<string, unknown>;
  const out: SavedPage[] = [];
  for (const val of Object.values(map)) {
    try {
      const s = typeof val === "string" ? val : JSON.stringify(val);
      out.push(SavedPage.fromJsonString(s));
    } catch {
      /* skip invalid row */
    }
  }
  return out;
}

async function persistEntries(entries: SavedPage[]): Promise<void> {
  const map: Record<string, string> = {};
  for (const e of entries) {
    map[e.preview.id] = e.toString();
  }
  await AsyncStorage.setItem(SAVED_PAGES_STORAGE_KEY, JSON.stringify(map));
}

export function SavedPagesProvider({ children }: { children: ReactNode }) {
  const [savedEntries, setSavedEntries] = useState<SavedPage[]>([]);
  const savedEntriesRef = useRef<SavedPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  savedEntriesRef.current = savedEntries;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await loadEntries();
        if (!cancelled) setSavedEntries(entries);
      } catch (e) {
        console.warn("[SavedPages] load failed", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const schedulePersist = useCallback((entries: SavedPage[]) => {
    void (async () => {
      try {
        await persistEntries(entries);
      } catch (e) {
        console.warn("[SavedPages] persist failed", e);
      }
    })();
  }, []);

  const isSaved = useCallback(
    (pageId: string) => savedEntries.some((e) => e.preview.id === pageId),
    [savedEntries],
  );

  const addSaved = useCallback(
    (entry: SavedPage) => {
      setSavedEntries((prev) => {
        const next = [...prev.filter((e) => e.preview.id !== entry.preview.id), entry];
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const replaceSaved = useCallback(
    (entry: SavedPage) => {
      setSavedEntries((prev) => {
        const next = [...prev.filter((e) => e.preview.id !== entry.preview.id), entry];
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const removeSaved = useCallback(
    (pageId: string) => {
      setSavedEntries((prev) => {
        const entry = prev.find((e) => e.preview.id === pageId);
        if (entry?.downloadedPageViewPath != null) {
          void deleteOfflineBundleFiles(pageId);
        }
        const next = prev.filter((e) => e.preview.id !== pageId);
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const removeDownloadBundle = useCallback(
    async (pageId: string) => {
      const entry = savedEntriesRef.current.find((e) => e.preview.id === pageId);
      if (entry == null || entry.downloadedPageViewPath == null) return;
      await deleteOfflineBundleFiles(pageId);
      const cleared = new SavedPage(
        entry.preview,
        entry.savedAt,
        null,
      );
      setSavedEntries((prev) => {
        const next = [...prev.filter((e) => e.preview.id !== pageId), cleared];
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const toggleSaveFromRopewikiPage = useCallback(
    (data: OnlineRopewikiPageView) => {
      setSavedEntries((prev) => {
        const existing = prev.find((e) => e.preview.id === data.id);
        if (existing != null) {
          if (existing.downloadedPageViewPath != null) {
            void deleteOfflineBundleFiles(data.id);
          }
          const next = prev.filter((e) => e.preview.id !== data.id);
          schedulePersist(next);
          return next;
        }
        const next = [...prev, data.toSavedPage()];
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const refreshFromStorage = useCallback(async () => {
    try {
      const entries = await loadEntries();
      setSavedEntries(entries);
    } catch (e) {
      console.warn("[SavedPages] refresh failed", e);
    }
  }, []);

  const value = useMemo<SavedPagesContextValue>(
    () => ({
      savedEntries,
      isLoading,
      isSaved,
      addSaved,
      replaceSaved,
      removeSaved,
      removeDownloadBundle,
      toggleSaveFromRopewikiPage,
      refreshFromStorage,
    }),
    [
      savedEntries,
      isLoading,
      isSaved,
      addSaved,
      replaceSaved,
      removeSaved,
      removeDownloadBundle,
      toggleSaveFromRopewikiPage,
      refreshFromStorage,
    ],
  );

  return (
    <SavedPagesContext.Provider value={value}>{children}</SavedPagesContext.Provider>
  );
}

export function useSavedPages(): SavedPagesContextValue {
  const ctx = useContext(SavedPagesContext);
  if (ctx == null) {
    throw new Error("useSavedPages must be used within SavedPagesProvider");
  }
  return ctx;
}
