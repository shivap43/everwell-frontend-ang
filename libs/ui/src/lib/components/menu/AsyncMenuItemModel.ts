export interface AsyncMenuItem {
    label: string;
    condition: boolean;
    callback: () => void;
}
