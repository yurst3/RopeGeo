import {
  ensureDownloadBackgroundTaskDefined,
  registerDownloadBackgroundTask,
} from "@/utils/download/downloadBackgroundTask";
import {
  mobileDownloadJobQueue,
  mobileDownloadPlatformHarness,
} from "@/utils/download/mobileDownloadJobQueue";
import { downloadJobQueueStore } from "@/utils/download/downloadJobQueueStore";
import { savedPageFromCompletedJob } from "@/utils/download/savedPageFromCompletedJob";
import { MAPBOX_STYLE_URLS } from "@/constants/mapbox";
import { useNetworkStatus } from "@/context/app/NetworkStatusContext";
import { useSavedPages } from "@/context/data/SavedPagesContext";
import { SERVICE_BASE_URL, Service } from "ropegeo-common/components";
import type { OnlineRopewikiPageView } from "ropegeo-common/models";
import type { DownloadJob, DownloadJobUISnapshot } from "ropegeo-common/download";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

type EnqueuePageDownloadInput = {
  pageId: string;
  data: OnlineRopewikiPageView;
};

export type EnqueueSavedPageDownloadInput = {
  pageId: string;
};

type DownloadJobQueueContextValue = {
  enqueuePageDownload: (input: EnqueuePageDownloadInput) => void;
  enqueueSavedPageDownload: (input: EnqueueSavedPageDownloadInput) => void;
  getJobUISnapshot: (pageId: string) => DownloadJobUISnapshot | null;
  abortJob: (pageId: string) => void;
  takeInvalidStoredDownloadPageId: (pageId: string) => boolean;
};

const DownloadJobQueueContext = createContext<DownloadJobQueueContextValue | null>(
  null,
);

function abortAllJobs(): void {
  const pageIds = Object.keys(mobileDownloadJobQueue.getSnapshots());
  for (const pageId of pageIds) {
    mobileDownloadJobQueue.abort(pageId);
  }
}

export function abortAllDownloadJobs(): void {
  abortAllJobs();
}

export function DownloadJobQueueProvider({ children }: { children: ReactNode }) {
  const queue = mobileDownloadJobQueue;
  const { isOnline } = useNetworkStatus();
  const { savedEntries, addSaved, replaceSaved, refreshFromStorage } = useSavedPages();
  const savedEntriesRef = useRef(savedEntries);
  const snapshots = useSyncExternalStore(
    downloadJobQueueStore.subscribe,
    downloadJobQueueStore.getSnapshot,
    downloadJobQueueStore.getSnapshot,
  );
  const pendingInvalidPageIdsRef = useRef<string[]>([]);

  useEffect(() => {
    savedEntriesRef.current = savedEntries;
  }, [savedEntries]);

  const makeOnSuccess = useCallback(
    () => async (job: DownloadJob) => {
      const savedPage = await savedPageFromCompletedJob(job, mobileDownloadPlatformHarness);
      replaceSaved(savedPage);
    },
    [replaceSaved],
  );

  useEffect(() => {
    ensureDownloadBackgroundTaskDefined();
    void (async () => {
      await registerDownloadBackgroundTask();
      await queue.restoreFromStorage();
      pendingInvalidPageIdsRef.current = queue.consumeInvalidStoredDownloadPageIds();
      await queue.runForegroundTicksWhileActive();
    })();
  }, [queue]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        downloadJobQueueStore.refreshSnapshot();
        void (async () => {
          await refreshFromStorage();
          pendingInvalidPageIdsRef.current = [
            ...pendingInvalidPageIdsRef.current,
            ...queue.consumeInvalidStoredDownloadPageIds(),
          ];
          await queue.runForegroundTicksWhileActive();
        })();
      }
    });
    return () => sub.remove();
  }, [queue, refreshFromStorage]);

  const downloadConfig = useMemo(
    () => ({
      mapboxStyleUrls: MAPBOX_STYLE_URLS,
      webScraperBaseUrl: SERVICE_BASE_URL[Service.WEBSCRAPER],
    }),
    [],
  );

  const enqueuePageDownload = useCallback(
    (input: EnqueuePageDownloadInput) => {
      if (!isOnline || input.data.fetchType !== "online") {
        return;
      }
      const existingAtEnqueue = savedEntriesRef.current.find(
        (entry) => entry.preview.id === input.pageId,
      );
      const baseAtEnqueue = existingAtEnqueue ?? input.data.toSavedPage();
      if (existingAtEnqueue == null) {
        addSaved(baseAtEnqueue);
      }

      const job = input.data.toDownloadJob({
        savedAt: baseAtEnqueue.savedAt,
        ...downloadConfig,
      });
      queue.enqueue(job, makeOnSuccess());
      void queue.runForegroundTicksWhileActive();
    },
    [addSaved, downloadConfig, isOnline, makeOnSuccess, queue],
  );

  const enqueueSavedPageDownload = useCallback(
    (input: EnqueueSavedPageDownloadInput) => {
      if (!isOnline) {
        return;
      }
      const saved = savedEntriesRef.current.find(
        (entry) => entry.preview.id === input.pageId,
      );
      if (saved == null) {
        return;
      }

      const job = saved.preview.toDownloadJob({
        savedAt: saved.savedAt,
        ...downloadConfig,
      });
      queue.enqueue(job, makeOnSuccess());
      void queue.runForegroundTicksWhileActive();
    },
    [downloadConfig, isOnline, makeOnSuccess, queue],
  );

  const abortJob = useCallback(
    (pageId: string) => {
      queue.abort(pageId);
    },
    [queue],
  );

  const getJobUISnapshot = useCallback(
    (pageId: string) => snapshots[pageId] ?? null,
    [snapshots],
  );

  const takeInvalidStoredDownloadPageId = useCallback((pageId: string) => {
    const idx = pendingInvalidPageIdsRef.current.indexOf(pageId);
    if (idx === -1) {
      return false;
    }
    pendingInvalidPageIdsRef.current.splice(idx, 1);
    return true;
  }, []);

  const value = useMemo<DownloadJobQueueContextValue>(
    () => ({
      enqueuePageDownload,
      enqueueSavedPageDownload,
      getJobUISnapshot,
      abortJob,
      takeInvalidStoredDownloadPageId,
    }),
    [
      abortJob,
      enqueuePageDownload,
      enqueueSavedPageDownload,
      getJobUISnapshot,
      takeInvalidStoredDownloadPageId,
    ],
  );

  return (
    <DownloadJobQueueContext.Provider value={value}>
      {children}
    </DownloadJobQueueContext.Provider>
  );
}

export function useDownloadJobQueue(): DownloadJobQueueContextValue {
  const ctx = useContext(DownloadJobQueueContext);
  if (ctx == null) {
    throw new Error("useDownloadJobQueue must be used within DownloadJobQueueProvider");
  }
  return ctx;
}

/** @deprecated Use {@link useDownloadJobQueue}. */
export const useDownloadQueue = useDownloadJobQueue;
