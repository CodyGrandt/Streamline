import type { DataDocument } from "../domain/model";
import type { DataRepository } from "./repository";

const storageKey = "training-log-prototype.v1";

type StoredDocument = {
  version: 1;
  data: DataDocument;
};

export const localStorageRepository: DataRepository = {
  load() {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw) as StoredDocument;
      return stored.version === 1 ? stored.data : null;
    } catch {
      return null;
    }
  },
  save(data) {
    const stored: StoredDocument = { version: 1, data };
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  },
  clear() {
    window.localStorage.removeItem(storageKey);
  },
};
