import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { of } from "rxjs";
import { ComponentType } from "@angular/cdk/portal";
export const mockMatBottomSheet = {
    open: (component: ComponentType<any>, config?: MatBottomSheet) =>
        ({
            afterDismissed: () => of(undefined),
        } as MatBottomSheetRef<any>),
} as MatBottomSheet;
