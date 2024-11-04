import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { SharedService } from "@empowered/common-services";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { select } from "@ngrx/store";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { map, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { SwitchEnrollmentMethodComponent } from "../../../switch-enrollment-method/switch-enrollment-method.component";
import { ActivatedRoute } from "@angular/router";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { combineLatest, Observable, Subject } from "rxjs";
import { SharedActions } from "@empowered/ngrx-store/ngrx-states/shared";
import { LanguageService } from "@empowered/language";
import { EnrollmentMethodDetail } from "@empowered/api";
import { AlertType, EnrollmentMethod, RESIDENT_STATE, SettingsDropdownName, ContactType } from "@empowered/constants";
import { ChangeAddressDialogPurpose, ChangeAddressDialogResult } from "./enrollment-method.model";
import { AlertMessage } from "../../plans-container/plans-container.model";
import {
    ConfirmAddressDialogComponent,
    DropDownPortalComponent,
    SettingsDropdownComponentStore,
    SettingsDropdownContent,
} from "@empowered/ui";

@Component({
    selector: "empowered-enrollment-method-settings",
    templateUrl: "./enrollment-method.component.html",
    styleUrls: ["./enrollment-method.component.scss"],
})
export class EnrollmentMethodSettingsComponent extends SettingsDropdownContent implements OnInit, OnDestroy {
    @Input() portalRef?: DropDownPortalComponent;

    readonly enrollmentsMethods$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentMethodDetails));
    readonly selectedEnrollmentMethod$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentMethodDetail));
    readonly crossBorderRules$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedCrossBorderRules));
    readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));
    readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));
    readonly selectedMemberContacts$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberContacts));

    readonly selectedMemberCountryStateAndCity$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity),
    );
    readonly selectedMemberCountryState$ = this.selectedMemberCountryStateAndCity$.pipe(map((stateAndCity) => stateAndCity?.countryState));
    readonly selectedMemberStateAbbreviation$ = this.selectedMemberCountryStateAndCity$.pipe(
        map((stateAndCity) => stateAndCity?.countryState.abbreviation),
    );

    // Form group for enrollment methods
    form: FormGroup;
    // Translations
    languageStrings: Record<string, string>;

    // F2F restriction alert message
    f2FRestrictionMessage$: Observable<AlertMessage | null> = combineLatest([
        this.selectedMemberContacts$,
        this.selectedMemberStateAbbreviation$,
        this.sharedService.currentProducerNotLicensedInEmployeeState,
        this.sharedService.currentProducerNotLicensedInCustomerState,
        this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentMethodDetail)),
    ]).pipe(
        map(([contacts, stateAbbreviation, payrollNotLicensed, directNotLicensed, enrollmentMethodDetail]) => {
            if (!contacts?.length) {
                return null;
            }
            const homeContact = contacts.find((contact) => contact.contactType === ContactType.HOME);
            if (!homeContact?.address) {
                return null;
            }
            if (stateAbbreviation !== RESIDENT_STATE.NEW_YORK && homeContact?.address.state === RESIDENT_STATE.NEW_YORK) {
                return { language: "primary.portal.situsState.non-nyGroupMessage", alertType: AlertType.INFO };
            }
            // to show alert message when the group is NY and employee is not
            if (stateAbbreviation === RESIDENT_STATE.NEW_YORK && homeContact?.address.state !== RESIDENT_STATE.NEW_YORK) {
                return { language: "primary.portal.situsState.nyGroupMessage", alertType: AlertType.INFO };
            }

            if (
                (payrollNotLicensed || directNotLicensed) &&
                !enrollmentMethodDetail?.enrollmentStates
                    ?.map((enrollmentState) => enrollmentState.state.abbreviation)
                    .includes(homeContact?.address.state)
            ) {
                return {
                    language: "primary.portal.enrollmentMethod.producerNotLicensedInEnrolleeState",
                    alertType: AlertType.INFO,
                };
            }
            // when both of group and employee are NY or non-NY
            return null;
        }),
    );

    // Disable apply button when F2F enrollment method is enforced
    disableApplyButton$: Observable<boolean> = this.f2FRestrictionMessage$.pipe(
        map((alertMessage) => Boolean(alertMessage)),
        takeUntil(this.unsubscribe$),
    );

    readonly onReset$ = new Subject<void>();
    readonly onRevert$ = new Subject<void>();
    readonly onApply$ = new Subject<void>();
    // Used to detect when to show FormGroup
    private readonly onShow$ = new Subject<void>();
    showResetButton$!: Observable<boolean>;

    constructor(
        protected readonly settingsDropdownStore: SettingsDropdownComponentStore,
        private readonly fb: FormBuilder,
        private readonly ngrxStore: NGRXStore,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
        private readonly sharedService: SharedService,
    ) {
        super(settingsDropdownStore, SettingsDropdownName.METHOD);
        this.languageStrings = this.getLanguageStrings();
        this.form = this.fb.group({
            selectedEnrollmentMethod: [null, Validators.required],
        });
    }

    /**
     * Initialize form data and call base class onInit.
     */
    ngOnInit(): void {
        super.onInit();

        this.getInitialValues().subscribe();

        this.showResetButton$ = this.settingsDropdownStore.showResetButtonOnDirty(this.form, this.onRevert$, this.onReset$, this.onApply$);
    }

    /**
     * Get initialize data based on values in store
     */
    getInitialValues(): Observable<EnrollmentMethodDetail> {
        return this.selectedEnrollmentMethod$.pipe(
            tap((method) => this.setFormValue(method.name)),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Get a Record of translations using LanguageService
     *
     * @returns Record<string,string> Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            "primary.portal.situsState.nyGroupMessage",
            "primary.portal.situsState.non-nyGroupMessage",
            "primary.portal.enrollmentMethod.producerNotLicensedInEnrolleeState",
        ]);
    }

    /**
     * function executes on hiding
     */
    onHide(): void {
        this.onRevert();
    }

    /**
     * function executes on show
     */
    onShow(): void {
        this.onShow$.next();
    }

    /**
     * function executes on revert
     */
    onRevert(): void {
        this.onRevert$.next();

        this.selectedEnrollmentMethod$
            .pipe(
                tap((enrollmentMethod) => {
                    this.form.reset(enrollmentMethod.name);
                    this.setFormValue(enrollmentMethod.name);
                }),
                take(1),
            )
            .subscribe();
    }

    /**
     * Triggers logic for selected enrollment method on click of apply
     */
    onApply(): void {
        this.onApply$.next();

        this.form.markAllAsTouched();
        // form.valid is coming as false, if any control is disabled and have value in it
        // Hence checking form.invalid
        if (this.form.invalid) {
            return;
        }
        switch (this.form.controls.selectedEnrollmentMethod.value) {
            case EnrollmentMethod.HEADSET:
            case EnrollmentMethod.PIN_SIGNATURE:
            case EnrollmentMethod.CALL_CENTER:
            case EnrollmentMethod.VIRTUAL_FACE_TO_FACE:
                this.openConfirmAddressDialog();
                break;
            case EnrollmentMethod.FACE_TO_FACE:
                this.switchToFaceToFace();
                break;
        }
    }

    /**
     * Implementation for abstract method of SettingsDropdownContent.
     *
     * Is used to emit when to reset FormGroup
     */
    onReset(): void {
        this.onReset$.next();
        this.onRevert();
        this.portalRef?.hide();
    }

    /**
     * Open pop up on selecting face to face method.
     */
    switchToFaceToFace(): void {
        combineLatest([this.mpGroup$, this.memberId$, this.selectedEnrollmentMethod$, this.selectedMemberCountryState$])
            .pipe(
                take(1),
                switchMap(([mpGroup, memberId, enrollmentMethod, enrollmentState]) => {
                    const switchEnrollmentDialogRef = this.dialog.open(SwitchEnrollmentMethodComponent, {
                        backdropClass: "backdrop-blur",
                        maxWidth: "600px", // 600px max-width based on the definition in abstract.
                        panelClass: "shopping-experience",
                        data: {
                            enrollmentType: this.form.controls.selectedEnrollmentMethod.value,
                            // selectedCountryState$ can return undefined/null
                            // if ngrx Shared state has selectedCountryState set to undefined/null
                            enrollmentState: enrollmentState?.name,
                            stateAbbreviation: enrollmentState?.abbreviation,
                            route: this.route,
                            mpGroup,
                            memberId,
                        },
                    });

                    return switchEnrollmentDialogRef.afterClosed().pipe(
                        tap((stateData) => {
                            // If there are stateData coming back from the SwitchEnrollmentDialogRef
                            // This means that NGXS state should have updated with new current EnrollmentMethod
                            // and possibly new selected CountryState/City
                            if (stateData) {
                                // Close dropdown
                                this.portalRef?.hide();
                            } else {
                                // Revert form state back to original EnrollmentMethod
                                this.setFormValue(enrollmentMethod.name);
                            }
                        }),
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Open Confirm Address Dialog if the user switches to Headset/Call-Center
     */
    openConfirmAddressDialog(): void {
        combineLatest([this.mpGroup$, this.memberId$, this.selectedEnrollmentMethod$])
            .pipe(
                take(1),
                switchMap(([mpGroup, memberId, enrollmentMethod]) => {
                    const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
                        width: "750px", // 750px max-width based on the definition in abstract.
                        data: {
                            memberId: memberId,
                            mpGroup: mpGroup,
                            purpose: ChangeAddressDialogPurpose.SHOP,
                            method: this.form.controls.selectedEnrollmentMethod.value,
                        },
                    });

                    return confirmAddressDialogRef.afterClosed().pipe(
                        tap((result) => {
                            if (result.action === ChangeAddressDialogResult.SHOP_SUCCESS) {
                                this.ngrxStore.dispatch(
                                    SharedActions.setSelectedEnrollmentMethodAndHeadsetStateAndCity({
                                        enrollmentMethod: this.form.controls.selectedEnrollmentMethod.value,
                                        headsetCountryState: result.newState,
                                        city: result.newCity,
                                    }),
                                );

                                this.portalRef?.hide();
                            } else {
                                this.setFormValue(enrollmentMethod.name);
                            }
                        }),
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Set enrollment method form value
     * @param value value to be set in form
     */
    setFormValue(value: string): void {
        this.form.setValue({ selectedEnrollmentMethod: value ?? "" });
    }

    /**
     * Returns unique identifier for EnrollmentMethodDetail.
     * trackBy for *ngFor involving EnrollmentMethodDetail used to improve performance.
     *
     * @param index {number} index of the iteration
     * @param enrollmentMethodDetail {EnrollmentMethodDetail} current EnrollmentMethodDetail in iteration
     * @returns unique identifier for EnrollmentMethodDetail
     */
    trackByEnrollmentMethodDescription(index: number, enrollmentMethodDetail: EnrollmentMethodDetail): string {
        return enrollmentMethodDetail.description;
    }

    /**
     * Call base class ngOnDestroy.
     */
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }
}
