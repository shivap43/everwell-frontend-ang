import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { map, tap, takeUntil } from "rxjs/operators";
import { TabMeta } from "../models";
import { EmpStepperService } from "./../stepper-service/emp-stepper.service";
import { Subject, Observable } from "rxjs";
import { TabModel } from "@empowered/constants";

@Component({
    selector: "empowered-tab-bar",
    templateUrl: "./tab-bar.component.html",
    styleUrls: ["./tab-bar.component.scss"],
})
export class TabBarComponent implements OnInit, OnDestroy {
    @Input() tabs$: Observable<TabModel[]>;
    @Input() enabledTabIds$: Observable<string[]>;
    enabledTabIds: string[] = [""];
    tabs: TabModel[] = [];
    tabState$: Observable<TabMeta[]> = this.stepperService.getTabStateStream();
    parentTabState$ = this.tabState$.pipe(
        map((tabState) =>
            tabState.filter((tabMeta) => {
                const parentTabs = this.tabs.filter((tab) => tab.parentTab === undefined);
                return parentTabs.find((parentTab) => parentTab.id === tabMeta.tabId);
            }),
        ),
    );
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(private readonly stepperService: EmpStepperService, private readonly changeDetector: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.tabs$
            .pipe(
                tap((tabs) => {
                    this.tabs = tabs;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.enabledTabIds$
            .pipe(
                tap((enabledTabIds) => {
                    this.enabledTabIds = enabledTabIds;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => this.changeDetector.detectChanges());
    }

    findChildren(tabStates: TabMeta[], parentTabId: string): TabMeta[] {
        return tabStates.filter((tabState) => {
            const childrenTabs = this.tabs.filter((tab) => tab.parentTab === parentTabId);
            return childrenTabs.find((childrenTab) => childrenTab.id === tabState.tabId);
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
    }
}
