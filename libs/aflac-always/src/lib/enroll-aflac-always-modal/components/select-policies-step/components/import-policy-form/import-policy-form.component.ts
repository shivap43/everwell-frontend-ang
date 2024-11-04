import { Component, forwardRef, Inject, OnInit, Optional } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, Validators } from "@angular/forms";
import { AflacService, MemberService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { combineLatest, Subject } from "rxjs";
import { tap, takeUntil, take } from "rxjs/operators";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { select } from "@ngrx/store";
import { AflacAlwaysActions } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EnrollAflacAlwaysModalData } from "../../../../enroll-aflac-always-modal.data";
import { DateService } from "@empowered/date";
import { DateFormats } from "@empowered/constants";
import { TpiServices } from "@empowered/common-services";

const NO_POLICY_FOUND = "Invalid policy number";
const ALPHA_NUMERIC_REGEX = "^[a-zA-Z0-9]+$";

export interface ImportPolicyFormKeys {
    firstName: string;
    lastName: string;
    birthDate: string;
    policyNumber: string;
}

export interface ImportPolicyLanguageKeys {
    importPolicyHeader: string;
    firstNameLabel: string;
    lastNameLabel: string;
    birthDateLabel: string;
    policyNumberLabel: string;
    importButtonLabel: string;
    requiredFieldLabel: string;
    alphaNumericLabel: string;
    policyNotFoundLabel: string;
    importPolicySuccessLabel: string;
}

@Component({
    selector: "empowered-import-policy-form",
    templateUrl: "./import-policy-form.component.html",
    styleUrls: ["./import-policy-form.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ImportPolicyFormComponent),
            multi: true,
        },
    ],
})
export class ImportPolicyFormComponent implements OnInit, ControlValueAccessor {
    readonly languageKeys: Record<keyof ImportPolicyLanguageKeys, string>;
    readonly languageStrings: Record<string, string>;
    readonly formKeys: Record<keyof ImportPolicyFormKeys, string>;

    formGroup: FormGroup;
    value: ImportPolicyFormKeys;
    isSpinnerLoading = false;
    apiResponseStatus = false;
    errorMessage = "";
    mpGroup: number;
    memberId: number;
    productId: number;
    private readonly unsubscribe$ = new Subject<void>();
    // Gets selected memberId
    private readonly selectedMemberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));
    // Gets selected mpGroup
    private readonly selectedMpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    constructor(
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: EnrollAflacAlwaysModalData,
        private readonly ngrxStore: NGRXStore,
        private readonly aflacService: AflacService,
        private readonly memberService: MemberService,
        private readonly dateService: DateService,
        private readonly fb: FormBuilder,
        private readonly tpiServices: TpiServices,
    ) {
        this.formKeys = this.buildFormKeys();
        this.languageKeys = this.buildLanguageKeys();
        this.languageStrings = this.buildLanguageStrings();
    }

    /**
     * @description Function to be called when the control value changes
     * @returns void
     * @param {ImportPolicyFormKeys} value
     * @memberof ImportPolicyFormComponent
     */
    onChange = (value: ImportPolicyFormKeys) => {
        this.value = value;
    };

    /**
     * @description Function to be called when the control is touched
     * @returns void
     * @memberof ImportPolicyFormComponent
     */
    onTouched = () => {};

    /**
     * @description Initializes the component
     * @returns void
     * @memberof ImportPolicyFormComponent
     */
    ngOnInit(): void {
        this.formGroup = this.buildFormGroup();
        combineLatest([this.selectedMpGroup$, this.selectedMemberId$])
            .pipe(
                take(1),
                tap(([mpGroup, memberId]) => {
                    this.memberId = this.data?.memberId ?? memberId ?? this.tpiServices.getMemberId();
                    this.mpGroup = this.data?.mpGroupId ?? mpGroup ?? this.tpiServices.getGroupId();
                    this.productId = this.data?.productId;
                    this.retrieveMemberInfo(this.memberId, this.mpGroup);
                }),
            )
            .subscribe();
    }

    /**
     * Fetches member information to display member attributes
     * @param memberId: member id
     * @param mpGroup: group id
     * @memberof ImportPolicyModalComponent
     */
    retrieveMemberInfo(memberId: number, mpGroup: number): void {
        this.memberService
            .getMember(memberId, false, mpGroup.toString())
            .pipe(
                tap((member) => {
                    this.formGroup.controls.firstName.setValue(member?.body?.name?.firstName);
                    this.formGroup.controls.lastName.setValue(member?.body?.name?.lastName);
                    const formattedDate = member?.body?.birthDate
                        ? this.dateService.format(member?.body?.birthDate, DateFormats.MONTH_DAY_YEAR)
                        : member?.body?.birthDate;
                    this.formGroup.controls.birthDate.setValue(formattedDate);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method used to import policy
     * @param mpGroupId: group id
     * @param memberId: member id
     * @param productId: product id
     */
    importPolicy(mpGroupId: number, memberId: number, productId: number): void {
        const policyNumberValue = this.formGroup.controls.policyNumber.value;
        if (policyNumberValue && this.formGroup.valid) {
            this.isSpinnerLoading = true;
            this.aflacService
                .policyLookup(memberId, policyNumberValue, mpGroupId, productId)
                .pipe(
                    tap(
                        () => {
                            this.apiResponseStatus = true;
                            this.isSpinnerLoading = false;
                            // dispatch action for enrollment set to bring up import policy
                            this.ngrxStore.dispatch(AflacAlwaysActions.loadAflacAlwaysEnrollments({ mpGroupId, memberId }));
                        },
                        (error) => {
                            this.isSpinnerLoading = false;
                            this.apiResponseStatus = false;
                            this.formGroup.controls.policyNumber.setErrors({ policyNumberInvalid: true });
                            this.errorMessage = error?.error?.message?.includes(NO_POLICY_FOUND)
                                ? this.languageStrings[this.languageKeys.policyNotFoundLabel]
                                : error?.error?.message;
                        },
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * @description Registers the on change function
     * @param fn (value: ImportPolicyFormKeys) => void
     * @returns void
     * @memberof ImportPolicyFormComponent
     */
    registerOnChange(fn: (value: ImportPolicyFormKeys) => void): void {
        this.onChange = fn;
    }

    /**
     * @description Registers the on touched function
     * @param fn () => void
     * @returns void
     * @memberof ImportPolicyFormComponent
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * @description Writes the value to the form
     * @param obj ImportPolicyFormKeys
     * @returns void
     * @memberof ImportPolicyFormComponent
     */
    writeValue(obj: ImportPolicyFormKeys): void {
        this.value = obj;
    }

    /**
     * @description Imports the policy
     * @returns void
     * @memberof ImportPolicyFormComponent
     */
    onImportPolicy() {
        this.importPolicy(this.mpGroup, this.memberId, this.productId);
    }

    /**
     * @description Builds the form keys
     * @returns Record<keyof ImportPolicyFormKeys, string>
     * @memberof ImportPolicyFormComponent
     * @private
     */
    private buildFormKeys(): Record<keyof ImportPolicyFormKeys, string> {
        return {
            firstName: "firstName",
            lastName: "lastName",
            birthDate: "birthDate",
            policyNumber: "policyNumber",
        };
    }

    /**
     * @description Builds the form group
     * @returns FormGroup
     * @memberof ImportPolicyFormComponent
     * @private
     */
    buildFormGroup(): FormGroup {
        return this.fb.group({
            firstName: [{ value: "" }],
            lastName: [{ value: "" }],
            birthDate: [{ value: "" }],
            policyNumber: ["", [Validators.required, Validators.pattern(ALPHA_NUMERIC_REGEX)]],
        });
    }

    /**
     * @description Builds the language keys
     * @returns Record<string, string>
     * @memberof ImportPolicyFormComponent
     * @private
     */
    private buildLanguageKeys(): Record<keyof ImportPolicyLanguageKeys, string> {
        return {
            importPolicyHeader: "primary.portal.aflac.always.modal.select.policies.import.policy.header.text",
            firstNameLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.firstname",
            lastNameLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.lastname",
            birthDateLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.birthdate",
            policyNumberLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.policy.number",
            importButtonLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.button.import",
            requiredFieldLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.required.field",
            alphaNumericLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.alpha.numeric",
            policyNotFoundLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.not.found",
            importPolicySuccessLabel: "primary.portal.aflac.always.modal.select.policies.import.policy.success",
        };
    }

    /**
     * @description Builds the language strings
     * @returns Record<string, string>
     * @memberof ImportPolicyFormComponent
     * @private
     */
    private buildLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            this.languageKeys.importPolicyHeader,
            this.languageKeys.firstNameLabel,
            this.languageKeys.lastNameLabel,
            this.languageKeys.birthDateLabel,
            this.languageKeys.policyNumberLabel,
            this.languageKeys.importButtonLabel,
            this.languageKeys.requiredFieldLabel,
            this.languageKeys.alphaNumericLabel,
            this.languageKeys.policyNotFoundLabel,
            this.languageKeys.importPolicySuccessLabel,
        ]);
    }
}
