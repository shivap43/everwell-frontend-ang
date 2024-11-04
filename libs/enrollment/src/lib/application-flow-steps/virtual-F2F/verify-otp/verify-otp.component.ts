import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Store } from "@ngxs/store";
import { EnrollmentState } from "@empowered/ngxs-store";
import { EnrollmentService, ShoppingCartDisplayService } from "@empowered/api";
import { switchMap, takeUntil, finalize } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { MemberData, Section, ApplicationResponse, StepTitle } from "@empowered/constants";

const SUBSCRIBER_FIRST_NAME = "<SubscriberFirstName>";
const SEND_OTP = 1;
const SIGN_APP = 3;

@Component({
    selector: "empowered-verify-otp",
    templateUrl: "./verify-otp.component.html",
    styleUrls: ["./verify-otp.component.scss"],
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
    // send otp step form group
    @Input() sendOtpForm: FormGroup;
    // virtual face to face step details
    @Input() vF2FStepDetails: { vF2FStepDetail: Section[]; planId: number; cartId: number }[];
    // This property is used to emit the next step index.
    @Output() stepChange = new EventEmitter<number>();
    // it holds extracted step info
    verifyOtpStepInfo: Section;
    // verify otp step form group
    verifyOtpForm: FormGroup;
    // flag for spinner. if true -> show spinner. if false -> hide spinner.
    showSpinner = false;
    // flag to check otp is verified or not
    isVerificationFailed = false;
    // selected electronic address
    electronicAddressValue: string;
    // member information
    memberInfo: MemberData;
    // This property used to clear subscription.
    private readonly unsubscribe$ = new Subject<void>();
    // token which will be replaced by selected electronic address
    electronicAddToken = "<EmailOrPhone>";
    // it holds all localized text
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.nextSignature",
        "primary.portal.vf2f.code",
        "primary.portal.vf2f.required",
        "primary.portal.vf2f.invalidCode",
    ]);

    /**
     * constructor of component
     * @param language - Reference of Language service [used to get localized value]
     * @param fb: form builder ref of angular package
     * @param enrollmentService - Enrollment service [used to verify otp]
     * @param store - Reference of ngxs store
     * @param shoppingCartService - instance of shopping cart display service [used to save responses]
     */
    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly enrollmentService: EnrollmentService,
        private readonly store: Store,
        private readonly shoppingCartService: ShoppingCartDisplayService,
    ) {}

    /**
     * Angular life cycle hook. it will be called at the time of initialization of component.
     * @returns void
     */
    ngOnInit(): void {
        this.verifyOtpForm = this.fb.group({
            verificationCode: ["", Validators.required],
        });
        this.memberInfo = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        this.getVerifyOtpStepInfo();
        const electronicAddress = this.sendOtpForm.controls.electronicAddress.value;
        const tempElectronicAddress = this.sendOtpForm.controls.tempElectronicAddress.value;
        if (tempElectronicAddress) {
            this.electronicAddressValue = tempElectronicAddress;
        } else {
            this.electronicAddressValue =
                electronicAddress && electronicAddress.sendToEmail ? electronicAddress.sendToEmail : electronicAddress.sendToPhone;
        }
    }

    /**
     * extract verify otp step information.
     * @returns void
     */
    getVerifyOtpStepInfo(): void {
        const stepDetails = this.vF2FStepDetails.find((stepDetail) => stepDetail.vF2FStepDetail.length > 0);
        if (stepDetails) {
            const vF2FSectionDetail = stepDetails.vF2FStepDetail;
            this.verifyOtpStepInfo = vF2FSectionDetail.find((section) =>
                section.steps.some((step) => step.title !== StepTitle.SEND_VERIFICATION),
            );
            this.verifyOtpStepInfo.title = this.verifyOtpStepInfo.title.replace(SUBSCRIBER_FIRST_NAME, this.memberInfo.info.name.firstName);
        }
    }

    /**
     * this method loads send otp step
     * @returns void
     */
    goToOtpSendStep(): void {
        this.stepChange.emit(SEND_OTP);
    }

    /**
     * This method saves response for step
     * @param mpGroup account id
     * @param memberId member id
     * @returns array of observable of saved applications.
     */
    saveResponse(mpGroup: number, memberId: number): Observable<ApplicationResponse>[] {
        const otp = this.verifyOtpForm.value.verificationCode;
        const applicationResponses$ = this.vF2FStepDetails.map((stepDetail) => {
            const sectionDetail = stepDetail.vF2FStepDetail.find((section) =>
                section.steps.some((step) => step.title !== StepTitle.SEND_VERIFICATION),
            );
            if (sectionDetail && sectionDetail.steps) {
                const stepInfo = sectionDetail.steps[0];
                const requestPayload = [
                    {
                        stepId: stepInfo.id,
                        type: stepInfo.type,
                        value: [
                            {
                                code: otp,
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
     * verify entered otp
     * @returns void
     */
    verifyOtp(): void {
        if (this.verifyOtpForm.valid) {
            this.showSpinner = true;
            this.isVerificationFailed = false;
            const mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
            const memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
            const otp = this.verifyOtpForm.value.verificationCode;
            this.enrollmentService
                .verifyOneTimePass(mpGroup, memberId, otp)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((res) => this.saveResponse(mpGroup, memberId)),
                    finalize(() => {
                        this.showSpinner = false;
                    }),
                )
                .subscribe(
                    (res) => {
                        this.stepChange.emit(SIGN_APP);
                    },
                    (err) => {
                        this.isVerificationFailed = true;
                    },
                );
        } else {
            const ctrl = this.verifyOtpForm.controls.verificationCode;
            ctrl.markAsTouched({ onlySelf: true });
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
