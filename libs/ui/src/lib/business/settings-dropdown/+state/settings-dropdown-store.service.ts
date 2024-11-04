import { ComponentStore } from "@ngrx/component-store";
import { Injectable } from "@angular/core";
import { SettingsDropdownState } from "./settings-dropdown.state";
import { FooterAction, SettingsDropdownName } from "@empowered/constants";
import { merge, Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { FormGroup } from "@angular/forms";

const DEFAULT_STATE: SettingsDropdownState = {
    active: undefined,
    footer: {
        footerAction: null,
    },
};

@Injectable()
export class SettingsDropdownComponentStore extends ComponentStore<SettingsDropdownState> {
    readonly setActiveDropdown = this.updater(
        (state, menuName: SettingsDropdownName): SettingsDropdownState => ({
            ...state,
            active: menuName,
        }),
    );

    readonly setFooterAction = this.updater(
        (state, footerAction: FooterAction): SettingsDropdownState => ({
            ...state,
            footer: {
                footerAction,
            },
        }),
    );

    constructor() {
        // initial state
        super(DEFAULT_STATE);
    }

    readonly selectActiveDropdown = () => this.select((state) => state.active);

    readonly selectFooter = () => this.select((state) => state.footer);

    /**
     * Placeholder hide/show reset button Observable to help migrating to new expected behavior
     *
     * @param form {FormGroup} Main FormGroup for dropdown
     */
    showResetButtonOnDirty(
        form: FormGroup,
        onRevert$: Observable<void>,
        onReset$: Observable<void>,
        onApply$: Observable<void>,
    ): Observable<boolean> {
        return merge(form.valueChanges, onRevert$, onReset$, onApply$).pipe(
            map(() => form.dirty),
            startWith(false),
        );
    }
}
