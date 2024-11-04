import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { DropDownPortalComponent } from "../../components/drop-down-portal/drop-down-portal/drop-down-portal.component";
import { FooterAction } from "@empowered/constants";
import { SettingsDropdownComponentStore } from "./+state/settings-dropdown-store.service";
import { SettingsDropdownContent } from "./settings-dropdown-content";
import { SettingsDropdownMeta } from "./settings-dropdown-meta.interface";

@Component({
    selector: "empowered-settings-dropdown",
    templateUrl: "./settings-dropdown.component.html",
    styleUrls: ["./settings-dropdown.component.scss"],
})
export class SettingsDropdownComponent implements OnInit, OnDestroy {
    @Input() meta!: SettingsDropdownMeta;
    @Input() settingsDropdownContent!: SettingsDropdownContent;

    @ViewChild(DropDownPortalComponent, { static: true }) portal!: DropDownPortalComponent;

    private readonly unsubscribe$ = new Subject<void>();

    constructor(private readonly settingsDropdownStore: SettingsDropdownComponentStore) {}

    /**
     * Setup dropdown shown state listeners.
     */
    ngOnInit(): void {
        // update active portal in store on shown event
        this.portal.shown
            .pipe(
                tap(() => {
                    this.settingsDropdownStore.setActiveDropdown(null);
                    this.settingsDropdownStore.setActiveDropdown(this.meta.name);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // clear active portal and footer action in store on hidden event
        this.portal.hidden
            .pipe(
                tap(() => {
                    this.settingsDropdownStore.setFooterAction(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Update store on revert click event.
     */
    revert(): void {
        this.settingsDropdownStore.setFooterAction(FooterAction.REVERT);
    }

    /**
     * Update store on apply click event.
     */
    apply(): void {
        this.settingsDropdownStore.setFooterAction(FooterAction.APPLY);
    }

    /**
     * Update store on reset click event.
     */
    reset(): void {
        this.settingsDropdownStore.setFooterAction(FooterAction.RESET);
    }

    /**
     * Clean up subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
