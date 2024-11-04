import { HttpErrorResponse } from "@angular/common/http";
import { Component, EventEmitter, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EmailTypes, EnrollmentService, MemberService, StaticService } from "@empowered/api";
import {
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    ContactType,
    EbsPaymentRecord,
    MemberContact,
    MemberProfile,
    ServerErrorResponseCode,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Select, Store } from "@ngxs/store";
import { Observable, Subject, EMPTY } from "rxjs";
import { catchError, distinctUntilChanged, filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { EBSInfoModalComponent } from "../ebs-info-modal/ebs-info-modal.component";
import { ConfirmSsnService } from "../ssn-input";
import { EmpoweredModalService } from "@empowered/common-services";
import { SsnFormatPipe } from "../../pipes";
import { RegexDataType, SharedState, UtilService } from "@empowered/ngxs-store";

const SSN_LENGTH_VALIDATION = 11;
const SSN_INPUT_FIELD_NAME = "ssn";
const CONFIRM_SSN_INPUT_FIELD_NAME = "confirmSSN";
const EMAIL = "emailAddress";

export interface EBSRequiredDialogData {
    memberInfo: MemberProfile;
    memberContacts: MemberContact[];
    mpGroupId: string;
    memberId: number;
    ssnConfirmationEnabled: boolean;
    ebsPaymentOnFile: boolean;
    enrollIds: number[];
}

@Component({
    selector: "empowered-ebs-required-info",
    templateUrl: "./ebs-required-info.component.html",
    styleUrls: ["./ebs-required-info.component.scss"],
})
export class EBSRequiredInfoComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.ebs.modal.title",
        "primary.portal.applicationFlow.ebs.modal.content",
        "primary.portal.applicationFlow.ebs.modal.continue",
        "primary.portal.common.cancel",
        "primary.portal.census.manualEntry.stepperBack",
        "primary.portal.direct.addCustomer.emailTooltipMessage",
        "primary.portal.direct.addCustomer.type",
        "primary.portal.common.select",
        "primary.portal.applicationFlow.ebs.successfulMsg",
        "primary.portal.applicationFlow.ebs.warningMsg",
    ]);
    isFormSubmit: boolean;
    mpGroupId: string;
    // The following variables are not typed because the service is subscribing to HTTPResponse object
    memberId: number;
    memberInfo: MemberProfile;
    validationRegex: RegexDataType;
    form: FormGroup;
    updateMemberInfo: MemberProfile;
    updateMemberContact: MemberContact = {};
    formControls: string[] = [];
    errorMessage: string;
    errorFlag: boolean;
    isEmailPresent: boolean;
    emailTypes: string[] = [];
    contactType: ContactType;
    isLoading = false;
    private readonly unsubscribe$ = new Subject<void>();
    private readonly ssnManualInputSubject$: Subject<string> = new Subject<string>();
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    paymentPresent = false;
    currentEbsOnfile: EbsPaymentRecord;
    isEbsRequiredFlow = new EventEmitter();
    ebsInfoDialog: MatDialogRef<EBSInfoModalComponent, any>;

    constructor(
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly fb: FormBuilder,
        private readonly confirmSsnService: ConfirmSsnService,
        private readonly ssnFormatPipe: SsnFormatPipe,
        private readonly memberService: MemberService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticService: StaticService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly dialogRef: MatDialogRef<EBSRequiredInfoComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: EBSRequiredDialogData,
    ) {}

    /**
     * Life cycle hook to initialize component data
     */
    ngOnInit(): void {
        this.isFormSubmit = false;
        this.mpGroupId = this.data.mpGroupId;
        this.memberId = this.data.memberId;
        this.memberInfo = this.utilService.copy(this.data.memberInfo);
        this.updateMemberInfo = this.utilService.copy(this.data.memberInfo);
        this.paymentPresent = this.data.ebsPaymentOnFile;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });

        this.emailTypes.push(EmailTypes.WORK);
        this.form = this.fb.group({
            emailAddress: "",
            phoneType: "",
            ssn: this.memberInfo?.ssn || "",
        });
        if (this.data.ssnConfirmationEnabled && !this.memberInfo.ssnConfirmed) {
            this.setupConfirmSSNField();
        }
        this.isEmailPresent = this.data.memberContacts.some((contact) => contact.emailAddresses?.length > 0);
        this.checkRequiredFields();
    }

    /**
     * Container function to call a checking function for each section of the form.
     */
    checkRequiredFields(): void {
        this.checkSSNField();
        this.checkEmail();
        this.checkConfirmSSNField();
    }

    /**
     * If member has not confirmed their SSN, or if there is no SSN on file
     * add a field that allows them to confirm it.
     */
    checkConfirmSSNField(): void {
        if (this.data.ssnConfirmationEnabled && !this.memberInfo.ssnConfirmed) {
            if (this.isFormSubmit && this.form.controls.confirmSSN.value) {
                this.updateMemberInfo.ssnConfirmed = this.form.controls.confirmSSN.valid;
                if (this.form.controls.confirmSSN.value === this.form.controls.ssn.value) {
                    this.updateMemberInfo.ssnConfirmed = this.form.controls.confirmSSN.valid;
                } else {
                    this.formControls.push(CONFIRM_SSN_INPUT_FIELD_NAME);
                    this.form.controls.confirmSSN.setErrors({ invalid: true });
                    this.form.controls.confirmSSN.setValidators([Validators.required]);
                }
            } else {
                this.formControls.push(CONFIRM_SSN_INPUT_FIELD_NAME);
                this.form.controls.confirmSSN.setErrors({ required: true });
                this.form.controls.confirmSSN.setValidators([Validators.required]);
            }
        }
    }

    /**
     * Function to check if SSN is present in member information,
     * If its not then make the field mandatory and add validations for proceeding further for enrollment
     */
    checkSSNField(): void {
        if (!this.memberInfo.ssn) {
            if (this.isFormSubmit && this.form.controls.ssn.value) {
                this.updateMemberInfo.ssn = this.form.controls.ssn?.value.replace(/-/g, "");
            } else {
                this.form.controls.ssn.setValidators([
                    Validators.required,
                    Validators.pattern(this.validationRegex.UNMASKSSN_ITIN),
                    Validators.minLength(SSN_LENGTH_VALIDATION),
                ]);
            }
        }
    }

    /**
     * This function is used to display api error
     * @param error HttpErrorResponse
     */
    errorBody(error: HttpErrorResponse): void {
        this.errorMessage = "";
        this.errorFlag = false;
        if (error.status === ServerErrorResponseCode.RESP_500) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.qle.pendindEnrollment.InternalServer.error");
            this.errorFlag = true;
        } else if (
            (error.error.status === ClientErrorResponseCode.RESP_400 || error.error.status === ClientErrorResponseCode.RESP_409) &&
            error.error.details
        ) {
            this.errorFlag = true;
            error.error.details.forEach((msg, i) => {
                if (i > 0) {
                    this.errorMessage += ", ";
                }
                if (msg.code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                    this.errorMessage = this.language.fetchPrimaryLanguageValue(msg.message);
                } else if (msg.field?.toLowerCase() === SSN_INPUT_FIELD_NAME) {
                    this.form.controls.ssn?.setErrors({
                        duplicateSSNFound: true,
                    });
                    this.errorFlag = false;
                } else {
                    this.errorMessage += error.error.details[i].message;
                }
            });
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
            this.errorFlag = true;
        }
    }

    /**
     * If member's email info doesn't already exist, add appropriate fields to form on startup
     * or add values in these fields to member's info on submission.
     */
    checkEmail(): void {
        if (!this.isEmailPresent) {
            if (this.isFormSubmit && this.form.controls.emailAddress.value && this.form.controls.phoneType.value) {
                this.updateMemberContact.emailAddresses = [
                    {
                        email: this.form.controls.emailAddress.value,
                        type: this.form.controls.phoneType.value,
                        primary: true,
                        verified: false,
                    },
                ];
            } else {
                if (!this.form.controls.emailAddress.value) {
                    this.form.controls.emailAddress.setErrors({ required: true });
                    this.form.controls.emailAddress.setValidators([Validators.required, Validators.pattern(this.validationRegex.EMAIL)]);
                } else {
                    this.form.controls.phoneType.setErrors({ required: true });
                    this.form.controls.phoneType.setValidators([Validators.required]);
                }
            }
        }
    }

    /**
     * Initializes the confirm SSN field and sets up listeners to enable/disable it.
     */
    setupConfirmSSNField(): void {
        const ssnSplitPattern = new RegExp(this.validationRegex.SSN_SPLIT_FORMAT);

        this.form.addControl(
            CONFIRM_SSN_INPUT_FIELD_NAME,
            this.fb.control({ value: "", disabled: !this.memberInfo.ssn }, { validators: [Validators.required] }),
        );
        const ssnInput = this.form.controls.ssn as FormControl;
        const confirmSSNInput = this.form.controls.confirmSSN as FormControl;
        const latestValidSSN$ = ssnInput.valueChanges.pipe(
            filter((ssn: string) => !ssn || (ssn.length === SSN_LENGTH_VALIDATION && !ssn.includes("X"))),
        );
        this.confirmSsnService
            .updateValidators(confirmSSNInput, latestValidSSN$, this.form.controls.ssn.statusChanges.pipe(distinctUntilChanged()))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        this.confirmSsnService
            .updateControl(confirmSSNInput, latestValidSSN$, this.ssnManualInputSubject$.asObservable())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        ssnInput.setValue(this.ssnFormatPipe.transform(this.memberInfo.ssn, ssnSplitPattern));
    }

    /**
     *
     * @description the function checks for consent and saves member contact details
     * @memberof EmployeeRequiredInfoComponent
     */
    saveInfo(): void {
        this.isLoading = true;
        this.isFormSubmit = true;
        this.form.markAllAsTouched();
        if (this.form.controls.ssn) {
            // This is a temporary fix to work around an open issue with forms (see below comments for original open issue)
            (this.form.controls.ssn.statusChanges as EventEmitter<string>).emit("TOUCHED");
        }
        if (this.form.controls.confirmSSN) {
            // This is a temporary fix to work around an open issue with forms:
            // https://github.com/angular/angular/issues/10887
            (this.form.controls.confirmSSN.statusChanges as EventEmitter<string>).emit("TOUCHED");
        }
        if (this.form.valid) {
            this.checkRequiredFields();
        }
        const ssnConfirmed = this.getSSNConfirmationStatus();
        if (this.form.valid) {
            if (this.form.controls.emailAddress.value) {
                if (this.updateMemberContact.emailAddresses[0].type === EmailTypes.PERSONAL) {
                    this.contactType = ContactType.HOME;
                } else if (this.updateMemberContact.emailAddresses[0].type === EmailTypes.WORK) {
                    this.contactType = ContactType.WORK;
                } else if (this.updateMemberContact.emailAddresses[0].type === EmailTypes.OTHER) {
                    this.contactType = ContactType.OTHER;
                }
            }
            if (this.form.controls.ssn.value && ssnConfirmed && this.form.controls.emailAddress.value) {
                this.saveMemberInfo(ssnConfirmed)
                    .pipe(
                        switchMap(() => this.saveMemberContact()),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe(() => {
                        this.isLoading = false;
                        this.closeDialogAndOpenEBSInfoModal();
                    });
            } else {
                if (this.form.controls.ssn?.value && ssnConfirmed) {
                    this.saveMemberInfo(ssnConfirmed)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe(() => {
                            this.isLoading = false;
                            this.closeDialogAndOpenEBSInfoModal();
                        });
                }
                if (this.form.controls.emailAddress?.value) {
                    this.saveMemberContact()
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe(() => {
                            this.isLoading = false;
                            this.closeDialogAndOpenEBSInfoModal();
                        });
                }
            }
        } else {
            this.isLoading = false;
        }
    }

    /**
     * Method to open EBS modal when configuration is enabled and payment status is valid and link is clicked
     * and handles API call when modal is closed
     * @returns void
     */
    closeDialogAndOpenEBSInfoModal(): void {
        this.dialogRef.addPanelClass("hide-modalbox");
        this.ebsInfoDialog = this.empoweredModalService.openDialog(EBSInfoModalComponent, {
            data: {
                isFromNonEnrollmentFlow: true,
                mpGroup: this.mpGroupId.toString(),
                memberId: this.memberId,
                ebsPaymentOnFile: this.paymentPresent,
            },
        });
        this.ebsInfoDialog
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((closeData) => {
                this.dialogRef.close();
                this.isEbsRequiredFlow.emit(closeData);
            });
    }

    /**
     * Method to save member contact
     * @returns Observable<void>
     */
    private saveMemberContact(): Observable<void> {
        return this.memberService
            .saveMemberContact(this.memberInfo.id, this.contactType, this.updateMemberContact, this.mpGroupId.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error: HttpErrorResponse) => {
                    this.isLoading = false;
                    this.errorBody(error);
                    return EMPTY;
                }),
            );
    }

    /**
     * Method to save SSN and SSN confirmed
     * @param ssnConfirmed
     * @returns Observable<void>
     */
    private saveMemberInfo(ssnConfirmed: boolean): Observable<void> {
        return this.memberService
            .updateMember({ ...this.updateMemberInfo, ssnConfirmed }, this.mpGroupId.toString(), this.memberInfo.id.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error: HttpErrorResponse) => {
                    this.isLoading = false;
                    this.errorBody(error);
                    return EMPTY;
                }),
            );
    }

    /**
     * Determines SSN confirmation status.
     *
     * @returns whether SSN was validated/confirmed.
     */
    getSSNConfirmationStatus(): boolean | undefined {
        if (this.data.ssnConfirmationEnabled) {
            return this.form.controls.confirmSSN ? this.form.controls.confirmSSN.valid : this.memberInfo.ssnConfirmed;
        }
        return undefined;
    }
    /**
     * Updates values on manual SSN input.
     *
     * @param value input value
     */
    onSSNInputChange(value: string): void {
        this.ssnManualInputSubject$.next(value);
    }

    /**
     * Method to decide the action to be taken on click of the button in the modal
     */
    buttonClick(): void {}
    /**
     * Method to perform close when cancel is clicked
     */
    onCancelClick(): void {}
    /**
     * Method to invoke Paylogix sites
     */
    gotoAflacEBS(): void {}

    /**
     * Method that implements destroy lifecycle hook to clean up observables
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
