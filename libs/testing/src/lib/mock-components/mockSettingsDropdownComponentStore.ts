import { FormGroup } from "@angular/forms";
import { SettingsDropdownName } from "@empowered/constants";
import { Observable, of, Subscription } from "rxjs";

export const mockSettingsDropdownComponentStore = {
    selectActiveDropdown: () => of(),
    selectFooter: () => of(),
    setActiveDropdown: (observableOrValue: SettingsDropdownName) => ({} as Subscription),
    showResetButtonOnDirty: (form: FormGroup, onRevert$: Observable<void>, onReset$: Observable<void>, onApply$: Observable<void>) =>
        of(true),
};
