export interface TabMeta {
    readonly tabId: string;

    active: boolean;
    state: TabState;
}

export type TabState = "CLEAN" | "TOUCHED" | "COMPLETED";
