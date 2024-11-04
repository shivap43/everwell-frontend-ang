import { SelectionModel } from "@angular/cdk/collections";
import { Component, forwardRef, Inject, Input, OnDestroy, OnInit, Optional } from "@angular/core";
import { FormGroup, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { EnrollAflacAlwaysModalData } from "../../../../enroll-aflac-always-modal.data";
import { AflacAlwaysEnrollments, AflacAlwaysStatus, AsyncStatus } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { select } from "@ngrx/store";
import { AflacAlwaysActions, AflacAlwaysSelectors } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { catchError, filter, map, take, takeUntil, tap } from "rxjs/operators";
import { combineLatest, of, Subject } from "rxjs";
import { AflacAlwaysHelperService } from "../../../../services/aflac-always-helper.service";
import { TpiServices } from "@empowered/common-services";

export interface EligiblePoliciesTableLanguageKeys {
    selectAll: string;
    selectPolicyHeader: string;
    planName: string;
    policyStatus: string;
    policyNumber: string;
    aflacAlwaysStatus: string;
    footerMessage: string;
    noPoliciesFound: string;
    eligiblePoliciesTable: string;
}

export enum EligiblePoliciesTableLanguageKeysEnum {
    SELECT = "select",
    PLAN_NAME = "planName",
    POLICY_STATUS = "policyStatus",
    POLICY_NUMBER = "policyNumber",
    AFLAC_ALWAYS_STATUS = "aflacAlwaysStatus",
    FOOTER = "footer",
}

@Component({
    selector: "empowered-eligible-policies-table",
    templateUrl: "./eligible-policies-table.component.html",
    styleUrls: ["./eligible-policies-table.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EligiblePoliciesTableComponent),
            multi: true,
        },
    ],
})
export class EligiblePoliciesTableComponent implements OnInit, OnDestroy {
    readonly languageStrings: Record<string, string> = null;
    readonly languageKeys: Record<keyof EligiblePoliciesTableLanguageKeys, string> = null;
    readonly tableKeys = EligiblePoliciesTableLanguageKeysEnum;
    readonly unsubscribe$ = new Subject<void>();

    @Input() isModalMode = false;

    formGroup: FormGroup = null;
    dataSource: MatTableDataSource<AflacAlwaysEnrollments> = new MatTableDataSource<AflacAlwaysEnrollments>();
    selection: SelectionModel<AflacAlwaysEnrollments> = new SelectionModel<AflacAlwaysEnrollments>(true, []);
    dataLoaded = false;
    ENROLLED = AflacAlwaysStatus.ENROLLED;
    PENDING = AflacAlwaysStatus.PENDING_CUSTOMER_SIGNATURE;
    PENDING_APPROVAL = AflacAlwaysStatus.PENDING_CARRIER_APPROVAL;
    noEligiblePolicies = false;

    mpGroupId = this.tpiServices.getGroupId();
    memberId = this.tpiServices.getMemberId();

    displayedColumns: string[] = [
        EligiblePoliciesTableLanguageKeysEnum.SELECT,
        EligiblePoliciesTableLanguageKeysEnum.PLAN_NAME,
        EligiblePoliciesTableLanguageKeysEnum.POLICY_STATUS,
        EligiblePoliciesTableLanguageKeysEnum.POLICY_NUMBER,
        EligiblePoliciesTableLanguageKeysEnum.AFLAC_ALWAYS_STATUS,
    ];

    aflacAlwaysEnrollments$ = this.ngrxStore
        .pipe(
            select(
                AflacAlwaysSelectors.getAflacAlwaysEnrollments(
                    this.data?.mpGroupId || this.mpGroupId,
                    this.data?.memberId || this.memberId,
                ),
            ),
        )
        .pipe(
            filter(
                (asyncAflacAlwaysEnrollments) =>
                    asyncAflacAlwaysEnrollments.status === AsyncStatus.SUCCEEDED ||
                    asyncAflacAlwaysEnrollments.status === AsyncStatus.FAILED,
            ),
            map((asyncAflacAlwaysEnrollments) => asyncAflacAlwaysEnrollments.value),
        );

    getSelectedAflacAlwaysEnrollments$ = this.ngrxStore
        .pipe(select(AflacAlwaysSelectors.getAflacAlwaysUserSelectionEnrollmentIds))
        .pipe(take(1));

    constructor(
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: EnrollAflacAlwaysModalData,
        private readonly ngrxStore: NGRXStore,
        private readonly aflacAlwaysHelperService: AflacAlwaysHelperService,
        private readonly tpiServices: TpiServices,
    ) {
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
    }

    /**
     * @description Initializes the component
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     */
    ngOnInit(): void {
        this.aflacAlwaysHelperService.setLoading(true);
        // Dispatching action to fetch AflacAlwaysEnrollments from API
        this.ngrxStore.dispatchIfIdle(
            AflacAlwaysActions.loadAflacAlwaysEnrollments({
                mpGroupId: this.data?.mpGroupId || this.mpGroupId,
                memberId: this.data?.memberId || this.memberId,
            }),
            AflacAlwaysSelectors.getAflacAlwaysEnrollments(this.data?.mpGroupId || this.mpGroupId, this.data?.memberId || this.memberId),
        );
        this.populateEligiblePoliciesTable();
    }

    /**
     * Method to check/uncheck user's selection
     */
    updateSelection(row: AflacAlwaysEnrollments) {
        this.selection.toggle(row);
        this.updateSelectionToStore();
    }

    /**
     * Updates the user's plan selection to the store
     */
    updateSelectionToStore(): void {
        const enrollmentIds: number[] = [];
        let cumulativeTotalCost = 0;
        if (this.selection.selected.length) {
            this.selection.selected.forEach((enrollment) => {
                cumulativeTotalCost += enrollment.totalCost;
                enrollmentIds.push(enrollment.enrollmentId);
            });
        }
        this.ngrxStore.dispatch(AflacAlwaysActions.setAflacAlwaysEnrollmentIds({ enrollmentIds }));
        this.ngrxStore.dispatch(AflacAlwaysActions.setAflacAlwaysCumulativeTotalCost({ cumulativeTotalCost }));
    }

    /**
     * Populates the policies table with the aflac always enrollments and the pre-selected plans
     */
    populateEligiblePoliciesTable(): void {
        combineLatest([this.aflacAlwaysEnrollments$, this.getSelectedAflacAlwaysEnrollments$])
            .pipe(
                tap(([enrollments, selectedEnrollmentIds]) => {
                    const preselectEnrollmentIds: number[] = [...selectedEnrollmentIds];
                    if (preselectEnrollmentIds.length === 0) {
                        enrollments.forEach((enrollment) => {
                            if (enrollment.aflacAlwaysStatus === AflacAlwaysStatus.NOT_ENROLLED) {
                                preselectEnrollmentIds.push(enrollment.enrollmentId);
                            }
                        });
                    }
                    if (preselectEnrollmentIds.length) {
                        const aflacAlwaysEnrollments = [];
                        preselectEnrollmentIds.forEach((enrollmentId) => {
                            aflacAlwaysEnrollments.push(enrollments.find((enrollment) => enrollment.enrollmentId === enrollmentId));
                        });
                        this.selection = new SelectionModel<AflacAlwaysEnrollments>(true, [...aflacAlwaysEnrollments]);
                        this.updateSelectionToStore();
                    } else {
                        this.noEligiblePolicies = true;
                    }
                    this.dataSource.data = enrollments ?? [];
                    this.dataLoaded = true;
                    this.aflacAlwaysHelperService.setLoading(false);
                }),
                catchError(() => {
                    this.noEligiblePolicies = true;
                    this.aflacAlwaysHelperService.setLoading(false);
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * @description Whether the number of selected elements matches the total number of rows.
     * @returns boolean
     * @memberof EligiblePoliciesTableComponent
     */
    isAllSelected(): boolean {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.filter((enrollment) => enrollment.aflacAlwaysStatus === AflacAlwaysStatus.NOT_ENROLLED).length;

        return numSelected === numRows;
    }

    /**
     * @description Toggle the selection of a row
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     */
    toggleAllCheckboxes(): void {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.selection.select(
                ...this.dataSource.data.filter((enrollment) => enrollment.aflacAlwaysStatus === AflacAlwaysStatus.NOT_ENROLLED),
            );
        }
        this.updateSelectionToStore();
    }

    /**
     * @description Builds the language keys for the component
     * @returns Record<string, string>
     * @memberof EligiblePoliciesTableComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof EligiblePoliciesTableLanguageKeys, string> {
        return {
            selectAll: "primary.portal.productExceptions.newException.selectAll",
            selectPolicyHeader: "primary.portal.aflac.always.policy.select",
            planName: "primary.portal.maintenanceBenefitsOffering.products.planName",
            policyStatus: "primary.portal.activityHistory.policyStatus",
            policyNumber: "primary.portal.dashboard.policyChangeRequestList.policyNumber",
            aflacAlwaysStatus: "primary.portal.aflac.always.policy.status",
            footerMessage: "primary.portal.aflac.always.policy.footer",
            noPoliciesFound: "primary.portal.aflac.always.policy.notfound",
            eligiblePoliciesTable: "primary.portal.aflac.always.policy.eligiblepoliciestable",
        };
    }

    /**
     * @description This function builds the language strings for the component
     * @returns Record<string, string>
     * @memberof EligiblePoliciesTableComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.selectAll,
            this.languageKeys.selectPolicyHeader,
            this.languageKeys.planName,
            this.languageKeys.policyStatus,
            this.languageKeys.policyNumber,
            this.languageKeys.aflacAlwaysStatus,
            this.languageKeys.footerMessage,
            this.languageKeys.noPoliciesFound,
            this.languageKeys.eligiblePoliciesTable,
        ]);
    }

    /**
     * @description Changes the value
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     */
    onChange: (value: string) => void = () => {};

    /**
     * @description Changes the touched state
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     */
    onTouched: () => void = () => {};
    /**
     * @description Changes the validation state
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     */
    onValidationChange = () => {};
    /**
     * @description Writes the value to the component
     * @param {string} value
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     * @override
     */
    writeValue(value: string): void {}

    /**
     * @description Registers the change event
     * @param { (value: string) => void } fn
     * @returns void
     * @memberof PaymentDateComponent
     * @override
     */
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    /**
     * @description Registers the touched event
     * @param {() => void} fn
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     * @override
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Registers a callback function to call when the validator inputs change.
     * @param fn the callback function
     * @returns void
     * @memberof EligiblePoliciesTableComponent
     * @override
     */
    registerOnValidatorChange?(fn: () => void): void {
        this.onValidationChange = fn;
    }

    /**
     * To destroy subscription when on OnDestroy lifecycle
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
