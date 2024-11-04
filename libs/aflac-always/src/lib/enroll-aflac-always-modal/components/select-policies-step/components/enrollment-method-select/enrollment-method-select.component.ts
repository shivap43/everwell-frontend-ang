import { Component, Inject, OnDestroy, OnInit, Optional } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EnrollmentMethodDetail, ShoppingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { catchError, finalize, takeUntil } from "rxjs/operators";
import { EnrollAflacAlwaysModalData } from "../../../../enroll-aflac-always-modal.data";
import { EnrollmentMethod } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { AflacAlwaysActions } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { AflacAlwaysHelperService } from "../../../../services/aflac-always-helper.service";
import { EMPTY, Subject } from "rxjs";
import { TpiServices } from "@empowered/common-services";
import { Store } from "@ngxs/store";
import { EnrollmentMethodState } from "@empowered/ngxs-store";
import { Router } from "@angular/router";

export interface EnrollmentMethodSelectLanguageKeys {
    enrollmentMethod: string;
    placeholderSelect: string;
    selectionRequired: string;
}

@Component({
    selector: "empowered-enrollment-method-select",
    templateUrl: "./enrollment-method-select.component.html",
    styleUrls: ["./enrollment-method-select.component.scss"],
})
export class EnrollmentMethodSelectComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();
    readonly languageStrings: Record<string, string>;
    readonly languageKeys: Record<keyof EnrollmentMethodSelectLanguageKeys, string>;

    enrollmentMethodDetails: EnrollmentMethodDetail[] = [];
    isEnrollmentMethodRequiredError = false;
    value: EnrollmentMethod;
    isDisabled = false;
    currentEnrollment: string;

    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly store: Store,
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: EnrollAflacAlwaysModalData,
        private readonly ngrxStore: NGRXStore,
        private readonly aflacAlwaysHelperService: AflacAlwaysHelperService,
        private readonly tpiServices: TpiServices,
        private readonly router: Router,
    ) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
    }

    /**
     * @description This function is called when the component is initialized
     *              and initializes the enrollment method details
     */
    ngOnInit(): void {
        this.aflacAlwaysHelperService.setLoading(true);
        this.initializeEnrollmentMethodDetails();
    }

    /**
     * @description This function is called when the component is changed
     * @memberof EnrollmentMethodSelectComponent
     * @param {EnrollmentMethodDetail} value
     * @returns void
     */
    onChange(value: EnrollmentMethod): void {
        this.value = value;
        this.updateEnrollmentMethod(value);
    }

    updateEnrollmentMethod(enrollmentMethod: EnrollmentMethod): void {
        this.ngrxStore.dispatch(AflacAlwaysActions.setAflacAlwaysEnrollmentMethod({ enrollmentMethod }));
    }

    /**
     * @description This function is called when the component is destroyed
     * @memberof EnrollmentMethodSelectComponent
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * @description This function builds the language keys for the component
     * @memberof EnrollmentMethodSelectComponent
     * @returns Record<string, string>
     */
    private buildLanguageKeys(): Record<keyof EnrollmentMethodSelectLanguageKeys, string> {
        return {
            enrollmentMethod: "primary.portal.commissionSplit.addUpdate.ruleEnrollMethod",
            placeholderSelect: "primary.portal.common.placeholderSelect",
            selectionRequired: "primary.portal.common.selectionRequired",
        };
    }

    /**
     * @description This function builds the language strings for the component
     * @memberof EnrollmentMethodSelectComponent
     * @returns Record<string, string>
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.enrollmentMethod,
            this.languageKeys.placeholderSelect,
            this.languageKeys.selectionRequired,
        ]);
    }

    /**
     * @description This function is called when the component is initialized
     *              and sets the enrollment method if user is in the enrollment flow
     */
    inEnrollmentFlow() {
        const url = this.router.url;
        if (url.includes("enrollment/app-flow")) {
            this.currentEnrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment).enrollmentMethod;
        }
    }

    /**
     * @description This function initializes the enrollment method details by
     *              calling the shopping service to get the enrollment methods for
     *              the given mpGroup
     * @memberof EnrollmentMethodSelectComponent
     * @returns void
     */
    initializeEnrollmentMethodDetails(): void {
        // TODO: As part of initial development we are only targeting F2F and PIN signature method for now.
        // Need to implement other enrollment methods when business clarifies.
        this.inEnrollmentFlow();
        this.shoppingService
            .getEnrollmentMethods(this.data?.mpGroupId || this.tpiServices.getGroupId())
            .pipe(
                finalize(() => {
                    this.aflacAlwaysHelperService.setLoading(false);
                }),
                catchError(() => EMPTY),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((enrollmentMethodDetails) => {
                // TODO: only implementing F2F and Pin Signature
                this.enrollmentMethodDetails = [
                    ...enrollmentMethodDetails.filter(
                        (enrollmentDetail) =>
                            enrollmentDetail.name === EnrollmentMethod.FACE_TO_FACE ||
                            enrollmentDetail.name === EnrollmentMethod.CALL_CENTER ||
                            enrollmentDetail.name === EnrollmentMethod.PIN_SIGNATURE ||
                            enrollmentDetail.name === EnrollmentMethod.HEADSET,
                    ),
                ];

                const currentEnrollmentMethodIncluded = enrollmentMethodDetails.find(
                    (enrollmentMethod) => enrollmentMethod.name === this.currentEnrollment,
                );
                if (this.currentEnrollment && currentEnrollmentMethodIncluded) {
                    this.value = this.currentEnrollment as EnrollmentMethod;
                } else {
                    this.value = EnrollmentMethod.FACE_TO_FACE;
                }
                this.updateEnrollmentMethod(this.value);
            });
    }
}
