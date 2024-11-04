import { FormGroup } from "@angular/forms";
import { SettingsDropdownName } from "@empowered/constants";
import { Observable, Subscription, of } from "rxjs";

export const mockSettingsDropdownStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
};
