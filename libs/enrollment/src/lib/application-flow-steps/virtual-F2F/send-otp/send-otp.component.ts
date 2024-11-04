import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { FormGroup, Validators, FormControl } from "@angular/forms";
import { ScreenHandOffComponent } from "../screen-hand-off/screen-hand-off.component";
import { EnrollmentState, SharedState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";

import { EmpoweredModalService } from "@empowered/common-services";
import { EnrollmentService, ShoppingCartDisplayService } from "@empowered/api";
import { Section, ApplicationResponse, StepTitle } from "@empowered/constants";
import { switchMap, takeUntil, finalize, filter } from "rxjs/operators";
import { Observable, forkJoin, Subject, of } from "rxjs";

const VERIFY_OTP = 2;

@Component({
    selector: "empowered-send-otp",
    templateUrl: "./send-otp.component.html",
    styleUrls: ["./send-otp.component.scss"],
})
export class SendOtpComponent implements OnInit, OnDestroy {
    // This property is used to emit the next step index.
    @Output() stepChange = new EventEmitter<number>();
    // step form group
    @Input() sendOtpForm: FormGroup;
    // virtual face to face step details
    @Input() vF2FStepDetails: { vF2FStepDetail: Section[]; planId: number; cartId: number }[];
    // it holds extracted step info
    sendOtpStepInfo: Section;
    // it holds member email id
    emailInfo: string;
    // it holds member phone number
    phoneNumber: string;
    // used to format the phone number
    country = "US";
    // flag to check otp is send or not
    isSendOtpFailed = false;
    // if true -> show spinner. if false -> hide spinner.
    showSpinner = false;
    // This property used to clear subscription.
    private readonly unsubscribe$ = new Subject<void>();
    // it holds all localized text
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.nextSignature",
        "primary.portal.vf2f.email",
        "primary.portal.vf2f.missingEmail",
        "primary.portal.vf2f.missingPhone",
        "primary.portal.vf2f.tempElectronicAddress",
        "primary.portal.vf2f.electronicAddress",
        "primary.portal.vf2f.required",
        "primary.portal.vf2f.invalidEmail",
        "primary.portal.vf2f.acknowledgement",
        "primary.portal.vf2f.missingAcknowledgement",
        "primary.portal.vf2f.sendCode",
        "primary.portal.vf2f.otp.error",
        "primary.portal.common.selectionRequired",
        "primary.portal.vf2f.phone",
        "primary.portal.vf2f.selected.electronicAddress",
    ]);

    /**
     * constructor of component
     * @param language - Reference of Language service [used to get localized value]
     * @param enrollmentService - Enrollment service [used to send otp]
     * @param store - Reference of ngxs store
     * @param shoppingCartService - instance of shopping cart display service [used to save responses]
     * @param empoweredModalService - instance of modal service. It is used to open screen hand off modal.
     */
    constructor(
        private readonly language: LanguageService,
        private readonly enrollmentService: EnrollmentService,
        private readonly store: Store,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {}

    /**
     * Angular life cycle hook. it will be called at the time of initialization of component.
     * @returns void
     */
    ngOnInit(): void {
        this.getSendOtpStepInfo();
        this.getMemberInfo();
        this.updateFormValidation();
    }

    /**
     * extract send otp step information.
     * @returns void
     */
    getSendOtpStepInfo(): void {
        const stepDetails = this.vF2FStepDetails.find((stepDetail) => stepDetail.vF2FStepDetail.length > 0);
        if (stepDetails) {
            const vF2FSectionDetail = stepDetails.vF2FStepDetail;
            this.sendOtpStepInfo = vF2FSectionDetail.find((section) =>
                section.steps.some((step) => step.title === StepTitle.SEND_VERIFICATION),
            );
        }
    }

    /**
     * extract member info from store
     * @returns void
     */
    getMemberInfo(): void {
        const memberInfo = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        this.phoneNumber = memberInfo.contactInfo[0].phoneNumber;
        this.emailInfo = memberInfo.contactInfo[0].email;
        if (!(this.phoneNumber || this.emailInfo)) {
            this.sendOtpForm.patchValue({
                electronicAddress: { isTempAddressRequired: true },
            });
        }
        this.sendOtpForm.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * validate step and show validation messages if step is invalid.
     * @param formGroup form group of send otp step
     * @returns void
     */
    validateStep(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((controlName) => {
            const control = formGroup.get(controlName);
            if (control instanceof FormControl && control.enabled) {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * This method updates validation of control [tempElectronicAddress].
     * @returns void
     */
    updateFormValidation(): void {
        const regex = this.store.selectSnapshot(SharedState.regex);
        this.sendOtpForm.controls.electronicAddress.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            const ctrl = this.sendOtpForm.controls.tempElectronicAddress;
            if (value && value.isTempAddressRequired) {
                ctrl.setValidators([Validators.required, Validators.pattern(regex.EMAIL_PHONE)]);
            } else {
                ctrl.clearValidators();
            }
            ctrl.updateValueAndValidity({ emitEvent: false });
        });
    }

    /**
     * This method helps to get selected electronic address.
     * @returns Required Electronic Address
     */
    getSelectedElectronicAddress(): { [key: string]: string } {
        let requiredElectronicAddress: { [key: string]: string };
        const electronicAddress = this.sendOtpForm.value.electronicAddress;
        if (electronicAddress.isTempAddressRequired) {
            const tempElectronicAddress = this.sendOtpForm.value.tempElectronicAddress;
            requiredElectronicAddress = tempElectronicAddress.includes("@")
                ? { sendToEmail: tempElectronicAddress }
                : { sendToPhone: tempElectronicAddress };
        } else {
            requiredElectronicAddress = electronicAddress;
        }
        return requiredElectronicAddress;
    }

    /**
     * This method saves response for step
     * @param mpGroup account id
     * @param memberId member id
     * @returns array of observable of saved applications.
     */
    saveResponse(mpGroup: number, memberId: number): Observable<ApplicationResponse>[] {
        const selectedElectronicAddress = this.getSelectedElectronicAddress();
        const electronicAddressPayload = selectedElectronicAddress.sendToEmail
            ? { email: selectedElectronicAddress.sendToEmail }
            : { phone: selectedElectronicAddress.sendToPhone };
        const applicationResponses$ = this.vF2FStepDetails.map((stepDetail) => {
            const sectionDetail = stepDetail.vF2FStepDetail.find((section) =>
                section.steps.some((step) => step.title === StepTitle.SEND_VERIFICATION),
            );
            if (sectionDetail && sectionDetail.steps) {
                const stepInfo = sectionDetail.steps[0];
                const requestPayload = [
                    {
                        stepId: stepInfo.id,
                        type: stepInfo.type,
                        value: [
                            {
                                ...electronicAddressPayload,
                                consent: this.sendOtpForm.value.confirmation,
                            },
                        ],
                    },
                ];
                return this.shoppingCartService.saveApplicationResponse(memberId, stepDetail.cartId, mpGroup, requestPayload);
            }
            return undefined;
        });
        return applicationResponses$;
    }

    /**
     * send otp to selected electronic address
     * @returns void
     */
    sendOtp(): void {
        if (this.sendOtpForm.valid && this.sendOtpForm.controls.confirmation.value) {
            this.showSpinner = true;
            this.isSendOtpFailed = false;
            const mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
            const memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
            const selectedElectronicAddress = this.getSelectedElectronicAddress();
            this.enrollmentService
                .sendOneTimePass(mpGroup, memberId, selectedElectronicAddress)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((res) => {
                        const arrayObservables = this.saveResponse(mpGroup, memberId).filter((otp) => !!otp);
                        if (arrayObservables && arrayObservables.length) {
                            return forkJoin(arrayObservables);
                        }
                        return of([]);
                    }),
                    finalize(() => {
                        this.showSpinner = false;
                    }),
                    switchMap((response) => this.empoweredModalService.openDialog(ScreenHandOffComponent, { data: true }).afterClosed()),
                    filter((isClosed) => isClosed),
                )
                .subscribe(
                    (res) => {
                        this.stepChange.emit(VERIFY_OTP);
                    },
                    (err) => {
                        this.isSendOtpFailed = true;
                    },
                );
        } else {
            this.validateStep(this.sendOtpForm);
        }
    }

    /**
     * Destroy Life cycle hook of component.
     * It is used to clear the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
