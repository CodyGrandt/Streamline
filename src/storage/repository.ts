import type { DataDocument } from "../domain/model";

export interface DataRepository {
  load(): DataDocument | null;
  save(data: DataDocument): void;
  clear(): void;
}
