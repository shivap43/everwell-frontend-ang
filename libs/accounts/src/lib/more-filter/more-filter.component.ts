import { Component, OnInit, Inject } from "@angular/core";
import { CONTAINER_DATA } from "../container-data";
import { OverlayRef } from "@angular/cdk/overlay";
import { Subject } from "rxjs";
import { FormGroup, FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { BreakpointData, BreakPointUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-more-filter",
    templateUrl: "./more-filter.component.html",
    styleUrls: ["./more-filter.component.scss"],
})
export class MoreFilterComponent implements OnInit {
    forMobileDevices = false;
    forMediumDevices = false;
    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = true;
    overlayRef: OverlayRef;
    moreFilterForm: FormGroup;
    filterApplied = new Subject();
    resetMoreFilterSubject = new Subject();
    companyFilterData;
    notificationFilterData;
    statusFilterData;
    previousAppliedFilter = [];
    companySelectedData: any[];
    notificationSelectedData: any[];
    statusSelectedData: any[];
    chips = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.filters",
        "primary.portal.assignAdmin.moreFilter.status",
        "primary.portal.common.moreFilter",
    ]);

    constructor(
        @Inject(CONTAINER_DATA) private readonly componentData: any,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
    ) {
        this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
            if (resp.size === "MD" || resp.size === "SM") {
                this.forMediumDevices = true;
                this.forMobileDevices = true;
            } else {
                this.forMediumDevices = false;
                this.forMobileDevices = false;
            }
        });

        this.breakPointUtilService.breakpointObserver$.subscribe((resp: BreakpointData) => {
            if (resp.size === "SM") {
                this.forMobileDevices = true;
            } else {
                this.forMobileDevices = false;
            }
        });

        this.notificationFilterData = this.componentData[0];
        this.notificationSelectedData = this.componentData[1];
        this.companyFilterData = this.componentData[2];
        this.companySelectedData = this.componentData[3];
        this.statusFilterData = this.componentData[4];
        this.statusSelectedData = this.componentData[5];
        this.previousAppliedFilter = this.componentData[6];
    }

    ngOnInit(): void {
        const notificationCheckBoxArray = this.formBuilder.array([]);
        this.notificationFilterData.forEach((notification) => {
            if (this.notificationSelectedData.includes(notification)) {
                notificationCheckBoxArray.push(this.formBuilder.control(true));
            } else {
                notificationCheckBoxArray.push(this.formBuilder.control(false));
            }
        });

        const companyCheckBoxArray = this.formBuilder.array([]);
        this.companyFilterData.forEach((company) => {
            if (JSON.stringify(this.companySelectedData).includes(JSON.stringify(company))) {
                companyCheckBoxArray.push(this.formBuilder.control(true));
            } else {
                companyCheckBoxArray.push(this.formBuilder.control(false));
            }
        });

        const statusCheckBoxArray = this.formBuilder.array([]);
        this.statusFilterData.forEach((status) => {
            if (this.statusSelectedData.includes(status)) {
                statusCheckBoxArray.push(this.formBuilder.control(true));
            } else {
                statusCheckBoxArray.push(this.formBuilder.control(false));
            }
        });

        this.moreFilterForm = this.formBuilder.group({
            notificationFilter: notificationCheckBoxArray,
            companyFilter: companyCheckBoxArray,
            statusFilter: statusCheckBoxArray,
        });
    }

    moreFilterApply(): void {
        const notificationFilterValues = this.moreFilterForm.controls.notificationFilter.value;
        const companyFilterValues = this.moreFilterForm.controls.companyFilter.value;
        const statusFilterValues = this.moreFilterForm.controls.statusFilter.value;

        const selectedNotificationData = [];
        notificationFilterValues.forEach((each, index) => {
            if (notificationFilterValues[index]) {
                selectedNotificationData.push(this.notificationFilterData[index]);
            }
        });

        const selectedCompanyData = [];
        companyFilterValues.forEach((each, index) => {
            if (companyFilterValues[index]) {
                selectedCompanyData.push(this.companyFilterData[index]);
            }
        });

        const selectedStatusData = [];
        statusFilterValues.forEach((each, index) => {
            if (statusFilterValues[index]) {
                selectedStatusData.push(this.statusFilterData[index]);
            }
        });

        this.filterApplied.next({
            selectedNotificationData: selectedNotificationData,
            selectedCompanyData: selectedCompanyData,
            selectedStatusData: selectedStatusData,
        });
    }

    resetMoreFilter(): void {
        const formControls = Object.keys(this.moreFilterForm.controls);
        this.resetMoreFilterSubject.next(formControls);
    }
}
