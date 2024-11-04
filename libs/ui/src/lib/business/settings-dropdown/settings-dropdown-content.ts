import { Inject, Injectable, OnDestroy } from "@angular/core";
import { FormArray, FormGroup } from "@angular/forms";
import { NEVER, Observable, of, Subject } from "rxjs";
import { tap, takeUntil, distinctUntilChanged, map, filter, switchMap, withLatestFrom } from "rxjs/operators";
import { FooterAction, SettingsDropdownName } from "@empowered/constants";
import { SettingsDropdownComponentStore } from "./+state/settings-dropdown-store.service";

@Injectable()
export abstract class SettingsDropdownContent implements OnDestroy {
    protected settingsDropdownStore: SettingsDropdownComponentStore;
    protected name: SettingsDropdownName;
    protected form!: FormGroup | FormArray;
    showResetButton$!: Observable<boolean>;
    disableApplyButton$: Observable<boolean> = of(false);

    protected unsubscribe$ = new Subject<void>();

    /**
     * Set name and access to store.
     */
    constructor(settingsDropdownStore: SettingsDropdownComponentStore, @Inject(SettingsDropdownName) name: SettingsDropdownName) {
        this.settingsDropdownStore = settingsDropdownStore;
        this.name = name;
    }

    /**
     * Begin listening to store for show/hide and apply/revert events.
     * Must be called by subclass (eg: 'super.onInit()').
     * Refer to components in 'libs\enrollment\src\lib\producer-shop\enrollment-settings\' directory.
     *
     * @param isExpanded$ {Observable<boolean>} (Optional) Can be used to determine which dropdown
     * is open if there are more than one dropdown with a given name.
     * Example is any of the PlanSettings dropdowns (SettingsDropdownName.BENEFIT_AMOUNT, etc)
     */
    onInit(isExpanded$: Observable<boolean> = of(true)): void {
        /**
         * Listen to component store for show and hide events.
         * 'undefined' is emitted on initialization and should be ignored.
         * 'null' means all dropdowns are hidden.
         */
        this.settingsDropdownStore
            .selectActiveDropdown()
            .pipe(
                // filters out emissions that occur during initialization
                filter((activeDropdown) => activeDropdown !== undefined),
                map((activeDropdown) => activeDropdown === this.name), // isActive
                distinctUntilChanged(),
                withLatestFrom(isExpanded$),
                switchMap(([isSelfShown, isExpanded]) => {
                    // Check if dropdown is currently expanded
                    if (!isExpanded) {
                        return NEVER;
                    }

                    if (isSelfShown) {
                        this.onShow();
                        /**
                         * Listen to component store for apply, revert and reset events.
                         * 'null' means no footer action has been triggered for the active portal or no portal is active
                         */
                        return this.settingsDropdownStore.selectFooter().pipe(
                            map((footer) => footer.footerAction),
                            // truthy check
                            filter<FooterAction>(Boolean),
                            tap((footerAction) => {
                                if (footerAction === FooterAction.APPLY) {
                                    this.onApply();
                                } else if (footerAction === FooterAction.RESET) {
                                    this.onReset();
                                } else {
                                    this.onRevert();
                                }
                            }),
                        );
                    }
                    this.onHide();

                    return NEVER;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Placeholder. Update form when dropdown is triggered.
     */
    abstract onShow(): void;

    /**
     * Placeholder. Subclasses can implement logic.
     */
    abstract onHide(): void;

    /**
     * Placeholder. Update form when dropdown is triggered.
     */
    abstract onApply(): void;

    /**
     * Placeholder. Subclasses can implement logic.
     */
    abstract onRevert(): void;

    /**
     * Placeholder. Subclasses can implement logic.
     */
    abstract onReset(): void;

    /**
     * Must be called by subclass (eg: 'super.ngOnDestroy()').
     * Refer to components in 'libs\enrollment\src\lib\producer-shop\enrollment-settings\' directory.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
