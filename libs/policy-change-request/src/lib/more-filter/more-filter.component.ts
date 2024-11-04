import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { CONTAINER_DATA } from "../container-data";
import { OverlayRef } from "@angular/cdk/overlay";
import { Subject, Subscription } from "rxjs";
import { FormGroup, FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { BreakpointData, BreakPointUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-more-filter",
    templateUrl: "./more-filter.component.html",
    styleUrls: ["./more-filter.component.scss"],
})
export class MoreFilterComponent implements OnInit, OnDestroy {
    subscriptions: Subscription[] = [];
    forMobileDevices = false;
    forMediumDevices = false;
    moreFilterForm: FormGroup;
    overlayRef: OverlayRef;
    filterApplied = new Subject();
    resetMoreFilterSubject = new Subject();
    statusFilterData;
    previousAppliedFilter = [];
    statusSelectedData: any[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.assignAdmin.moreFilter.status",
        "primary.portal.common.filters",
    ]);

    constructor(
        @Inject(CONTAINER_DATA) private readonly componentData: any,
        private readonly language: LanguageService,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.subscriptions.push(
            this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
                if (resp.size === "MD" || resp.size === "SM") {
                    this.forMediumDevices = true;
                    this.forMobileDevices = true;
                } else {
                    this.forMediumDevices = false;
                    this.forMobileDevices = false;
                }
            }),
        );

        this.subscriptions.push(
            this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
                if (resp.size === "SM") {
                    this.forMobileDevices = true;
                } else {
                    this.forMobileDevices = false;
                }
            }),
        );
        this.statusFilterData = this.componentData[0];
        this.previousAppliedFilter = this.componentData[1];
        this.statusSelectedData = this.componentData[2];
    }

    ngOnInit(): void {
        const statusCheckBoxArray = this.formBuilder.array([]);
        this.statusFilterData.forEach((value) => {
            if (this.statusSelectedData.includes(value)) {
                statusCheckBoxArray.push(this.formBuilder.control(true));
            } else {
                statusCheckBoxArray.push(this.formBuilder.control(false));
            }
        });

        this.moreFilterForm = this.formBuilder.group({
            statusFilter: statusCheckBoxArray,
        });
    }
    moreFilterApply(): void {
        const statusFilterValues = this.moreFilterForm.controls.statusFilter.value;

        const selectedStatusData = [];
        statusFilterValues.forEach((each, index) => {
            // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
            statusFilterValues[index] && selectedStatusData.push(this.statusFilterData[index]);
        });

        this.filterApplied.next({
            selectedStatusData: selectedStatusData,
        });
    }

    resetMoreFilter(): void {
        const formControls = Object.keys(this.moreFilterForm.controls);

        this.resetMoreFilterSubject.next(formControls);
    }

    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
    }
}
