import { of } from "rxjs";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";

export const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
    closeAll: () => {},
    close: () => {},
    afterOpened: () => of(null),
} as unknown as MatDialog;

export const mockMatDialogData = {
    mpGroup: 167891,
};

export const mockMatDialogRef = {
    close: () => {},
    addPanelClass: (classes: string | string[]) => {},
};
