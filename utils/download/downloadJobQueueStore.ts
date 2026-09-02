import type { DownloadJobUISnapshot } from "ropegeo-common/download";
import { mobileDownloadJobQueue } from "@/utils/download/mobileDownloadJobQueue";

function snapshotEqual(a: DownloadJobUISnapshot, b: DownloadJobUISnapshot): boolean {
  return (
    a.pageId === b.pageId &&
    a.state === b.state &&
    a.phaseTitle === b.phaseTitle &&
    a.phaseProgress === b.phaseProgress &&
    a.displayStep === b.displayStep &&
    a.displayTotal === b.displayTotal &&
    a.errorMessage === b.errorMessage
  );
}

function snapshotsEqual(
  a: Record<string, DownloadJobUISnapshot>,
  b: Record<string, DownloadJobUISnapshot>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const pageId of aKeys) {
    const bSnapshot = b[pageId];
    if (bSnapshot == null || !snapshotEqual(a[pageId]!, bSnapshot)) {
      return false;
    }
  }
  return true;
}

let cachedSnapshots: Record<string, DownloadJobUISnapshot> =
  mobileDownloadJobQueue.getSnapshots();

const listeners = new Set<() => void>();
let queueUnsubscribe: (() => void) | null = null;

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function commitSnapshots(next: Record<string, DownloadJobUISnapshot>): void {
  if (snapshotsEqual(cachedSnapshots, next)) {
    return;
  }
  cachedSnapshots = next;
  notifyListeners();
}

function ensureQueueSubscription(): void {
  if (queueUnsubscribe != null) {
    return;
  }
  queueUnsubscribe = mobileDownloadJobQueue.subscribe(commitSnapshots);
}

function subscribe(onStoreChange: () => void): () => void {
  ensureQueueSubscription();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): Record<string, DownloadJobUISnapshot> {
  return cachedSnapshots;
}

/** Re-read queue snapshots (e.g. after foregrounding) with the same equality gate. */
function refreshSnapshot(): void {
  commitSnapshots(mobileDownloadJobQueue.getSnapshots());
}

export const downloadJobQueueStore = {
  subscribe,
  getSnapshot,
  refreshSnapshot,
};
