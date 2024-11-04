import { Component, OnDestroy, OnInit } from "@angular/core";
import { MemberService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { SetWizardMenuTab, MemberWizardState } from "@empowered/ngxs-store";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-preferences-tab",
    templateUrl: "./preferences-tab.component.html",
    styleUrls: ["./preferences-tab.component.scss"],
})
export class PreferencesTabComponent implements OnInit, OnDestroy {
    @Select(MemberWizardState.GetWizardTabMenu) wizardMenuTab$: Observable<any>;
    tabs: any[];
    nextTab: any;
    prevTab: any;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(private memberService: MemberService, private store: Store) {}

    ngOnInit(): void {
        this.wizardMenuTab$.pipe(takeUntil(this.unsubscribe$)).subscribe((tabs) => {
            if (tabs) {
                this.tabs = tabs;
                const idx = tabs.findIndex((x) => x.label.toLowerCase() === "preference");
                this.nextTab = tabs[idx + 1];
                this.prevTab = tabs[idx - 1];
            } else {
                this.store.dispatch(new SetWizardMenuTab(this.memberService.getMemberWizardTabMenu()));
            }
        });
    }
    goToTab(tab: any): void {
        this.memberService.wizardCurrentTab$.next(this.tabs.findIndex((x) => x.label === tab.label));
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
