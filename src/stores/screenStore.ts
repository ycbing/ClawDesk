import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ScreenRecord {
  id: string;
  /** Compressed JPEG base64 (data URI stripped) for list thumbnail */
  thumbnail: string;
  /** Original compressed image base64 for full view */
  imageBase64: string;
  /** User question */
  question: string;
  /** AI response */
  answer: string;
  /** Timestamp */
  createdAt: number;
  /** Whether the AI is still streaming */
  isStreaming: boolean;
}

interface ScreenState {
  records: ScreenRecord[];
  activeRecordId: string | null;
  /** "list" | "capture" | "result" */
  viewMode: "list" | "capture" | "result";

  addRecord: (record: Omit<ScreenRecord, "id" | "createdAt" | "isStreaming">) => string;
  updateRecord: (id: string, partial: Partial<ScreenRecord>) => void;
  deleteRecord: (id: string) => void;
  setActiveRecordId: (id: string | null) => void;
  setViewMode: (mode: ScreenState["viewMode"]) => void;
}

export const useScreenStore = create<ScreenState>()(
  persist(
    (set) => ({
      records: [],
      activeRecordId: null,
      viewMode: "list",

      addRecord: (record) => {
        const id = crypto.randomUUID();
        set((state) => ({
          records: [
            { ...record, id, createdAt: Date.now(), isStreaming: true },
            ...state.records,
          ],
          activeRecordId: id,
          viewMode: "result",
        }));
        return id;
      },

      updateRecord: (id, partial) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...partial } : r
          ),
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
          activeRecordId:
            state.activeRecordId === id ? null : state.activeRecordId,
        }));
      },

      setActiveRecordId: (id) => {
        set((state) => ({
          activeRecordId: id,
          viewMode: id ? "result" : "list",
        }));
      },

      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    { name: "clawdesk-screens" }
  )
);
