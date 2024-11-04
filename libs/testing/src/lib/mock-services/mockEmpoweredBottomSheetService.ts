import { ComponentType } from "@angular/cdk/portal";
import { MatBottomSheetConfig, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { Observable, of } from "rxjs";

export const mockEmpoweredSheetService = {
    openSheet: (ccomponent: ComponentType<any>, config?: MatBottomSheetConfig<any>, cancelHook?: () => Observable<boolean>) =>
        ({
            afterDismissed: () => of(undefined),
        } as MatBottomSheetRef<any>),
};
