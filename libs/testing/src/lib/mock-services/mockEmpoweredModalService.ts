import { ComponentType } from "@angular/cdk/portal";
import { TemplateRef } from "@angular/core";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { of } from "rxjs";

export const mockEmpoweredModalService = {
    openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
    closeDialog: () => null,
};
