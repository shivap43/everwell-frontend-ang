import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { CONTAINER_DATA } from "../container-data";
import { OverlayRef } from "@angular/cdk/overlay";
import { Subject } from "rxjs";
import { FormGroup, FormBuilder } from "@angular/forms";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { BreakpointData, BreakPointUtilService } from "@empowered/ngxs-store";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-more-filter",
    templateUrl: "./more-filter.component.html",
    styleUrls: ["./more-filter.component.scss"],
})
export class MoreFilterComponent implements OnInit, OnDestroy {
    forMobileDevices = false;
    forMediumDevices = false;
    overlayRef: OverlayRef;
    moreFilterForm: FormGroup;
    filterApplied = new Subject();
    resetMoreFilterSubject = new Subject();
    productFilterData;
    reasonFilterData;
    previousAppliedFilter = [];
    productSelectedData: any[];
    reasonSelectedData: any[];
    BREAKPOINT_SIZES = AppSettings.BREAKPOINT_SIZES;
    private readonly unsubscribe$ = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.filters",
        "primary.portal.accountPending.reason",
        "primary.portal.common.moreFilter",
        "primary.portal.accountPending.product",
    ]);

    constructor(
        @Inject(CONTAINER_DATA) private readonly componentData: any,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.breakPointUtilService.breakpointObserver$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: BreakpointData) => {
            if (resp.size === this.BREAKPOINT_SIZES.MD || resp.size === this.BREAKPOINT_SIZES.SM) {
                this.forMediumDevices = true;
                this.forMobileDevices = true;
            } else {
                this.forMediumDevices = false;
                this.forMobileDevices = false;
            }
        });

        this.breakPointUtilService.breakpointObserver$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: BreakpointData) => {
            if (resp.size === this.BREAKPOINT_SIZES.SM) {
                this.forMobileDevices = true;
            } else {
                this.forMobileDevices = false;
            }
        });

        this.productFilterData = this.componentData[0];
        this.productSelectedData = this.componentData[2];

        this.reasonFilterData = this.componentData[1];
        this.reasonSelectedData = this.componentData[3];
    }

    ngOnInit(): void {
        const productCheckBoxArray = this.formBuilder.array([]);
        this.productFilterData.forEach((product) => {
            if (this.productSelectedData.includes(product)) {
                productCheckBoxArray.push(this.formBuilder.control(true));
            } else {
                productCheckBoxArray.push(this.formBuilder.control(false));
            }
        });

        const reasonCheckBoxArray = this.formBuilder.array([]);
        this.reasonFilterData.forEach((reason) => {
            if (this.reasonSelectedData.includes(reason)) {
                reasonCheckBoxArray.push(this.formBuilder.control(true));
            } else {
                reasonCheckBoxArray.push(this.formBuilder.control(false));
            }
        });

        this.moreFilterForm = this.formBuilder.group({
            productFilter: productCheckBoxArray,
            reasonFilter: reasonCheckBoxArray,
        });
    }

    moreFilterApply(): void {
        const productFilterValues = this.moreFilterForm.controls.productFilter.value;

        const selectedProductData = [];
        productFilterValues.forEach((each, index) => {
            if (productFilterValues[index]) {
                selectedProductData.push(this.productFilterData[index]);
            }
        });

        const reasonFilterValues = this.moreFilterForm.controls.reasonFilter.value;

        const selectedReasonData = [];
        productFilterValues.forEach((each, index) => {
            if (reasonFilterValues[index]) {
                selectedReasonData.push(this.reasonFilterData[index]);
            }
        });

        this.filterApplied.next({
            selectedProductData: selectedProductData,
            selectedReasonData: selectedReasonData,
        });
    }

    resetMoreFilter(): void {
        const formControls = Object.keys(this.moreFilterForm.controls);

        this.resetMoreFilterSubject.next(formControls);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
