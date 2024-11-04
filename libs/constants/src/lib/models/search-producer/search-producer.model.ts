export interface NavLink {
    label: string;
    id: number;
    type: string;
}
export interface Params {
    size?: number;
    page?: number;
    search?: string;
}
export interface ProducerDialogData {
    isDirect?: boolean;
    roleTwentyAccountPermission?: boolean;
    roleTwentyDirectPermission?: boolean;
    dialogTitle: string;
    dialogSubtitle: string;
}
