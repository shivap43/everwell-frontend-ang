import { Component, OnInit, Optional, Inject, OnDestroy, Input } from "@angular/core";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Observable, combineLatest, Subject, forkJoin, of } from "rxjs";
import { FormBuilder, Validators, FormGroup, AbstractControl, FormControl } from "@angular/forms";
import {
    MemberService,
    AccountService,
    AflacService,
    StaticService,
    SSNMask,
    EnrollmentService,
    CommissionSplit,
    PendingReasonForPdaCompletion,
    SendReminderMode,
    ShoppingCartDisplayService,
    ContactMethodTypes,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { PdaForm, FormType } from "@empowered/api";
import { tap, filter, takeUntil, switchMap } from "rxjs/operators";
import { UserService } from "@empowered/user";
import {
    ConfigName,
    DateFormats,
    SSN_FORMAT,
    SSN_MIN_LENGTH,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    PayFrequency,
    AccountProducer,
    PdaData,
    EnrollmentMethod,
    ProducerCredential,
    StatusType,
    MemberContactListDisplay,
    CompanyCode,
} from "@empowered/constants";
import { Router, ActivatedRoute } from "@angular/router";
import { NgxMaskPipe } from "ngx-mask";
import {
    StaticUtilService,
    UtilService,
    SharedState,
    RegexDataType,
    EnrollmentMethodState,
    EnrollmentMethodModel,
} from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

import { SendApplicantPdaComponent } from "../send-applicant-pda/send-applicant-pda.component";

const MIN_SIGNATURE_LENGTH = 2;
const MAX_SIGNATURE_LENGTH = 50;
const SELECT = "Select";
const APP_FLOW = "appFlow";
const QUASI = "quasi";
const NEW = "NEW";
const LOCATION = "location";
const FIXING_VALUE = 2;
const DEPARTMENT_LENGTH = 4;
const DEPARTMENT_MIN_LENGTH = 4;
const DEPARTMENT_MAX_LENGTH = 30;
const AMOUNT_ZERO = 0.0;
const MIN_PIN_LENGTH = 3;
const PR = "PR";
const RADIX_TEN = 10;
const COVERAGE_SUMMARY = "COVERAGE_SUMMARY";
const TRUE = "true";

export interface PdaPolicy {
    policyName: string;
    subPolicyName?: string;
    policyNumber?: number;
    totalPremium?: number;
    employerContribution?: number;
    employeeDeduction?: number;
    oneFieldReqError?: boolean;
    employerDeductionError?: boolean;
}

@Component({
    selector: "empowered-pda-pr",
    templateUrl: "./pda-pr.component.html",
    styleUrls: ["./pda-pr.component.scss"],
})
export class PdaPrComponent implements OnInit, OnDestroy {
    @Input() openAs: string;
    @Input() tpiData: PdaData;
    @Input() flow: string;
    private isTpiPRState: boolean;
    pdaFormData: PdaForm;
    producerId: number;
    pdaFormValues: PdaForm = {} as PdaForm;
    prPDAForm: FormGroup;
    isMember = false;
    portal = "";
    enrollmentObj: EnrollmentMethodModel;
    memberId: string;
    mpGroup: number;
    loadSpinner: boolean;
    allowedPdaPolicyNames: Array<string> = [];
    minDate = new Date();
    producerName: string;
    writingNumber: string;
    payrollMode: string;
    pdaPolicy: string;
    isHeadset = false;
    enrollmentType: string;
    isSubmitted = false;
    errorFieldFlag = false;
    primaryProducer: AccountProducer[];
    isConfigAvailable = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pda.form.paymentInfo",
        "primary.portal.pda.form.employeeInfo",
        "primary.portal.pda.form.producerInfo",
        "primary.portal.pda.form.departmentNum",
        "primary.portal.pda.form.location",
        "primary.portal.pda.form.deductionDate",
        "primary.portal.pda.form.payrollMode",
        "primary.portal.pda.form.deductionFrequencyPara",
        "primary.portal.pda.form.firstName",
        "primary.portal.pda.form.mi",
        "primary.portal.pda.form.lastName",
        "primary.portal.pda.form.employeeSSN",
        "primary.portal.pda.form.employerAccount",
        "primary.portal.pda.form.employeeSign",
        "primary.portal.pda.form.producerName",
        "primary.portal.pda.form.date",
        "primary.portal.pda.form.writingNumber",
        "primary.portal.pda.form.herebyAuthorizeText",
        "primary.portal.pda.form.additionUnderstandText",
        "primary.portal.pda.form.certifyFeaturesText",
        "primary.portal.pda.form.customerSignLater",
        "primary.portal.pda.form.aflacRadioText",
        "primary.portal.pda.form.policyName",
        "primary.portal.pda.form.atleastOneField",
        "primary.portal.pda.form.signRequired",
        "primary.portal.setPrices.dollar",
        "primary.portal.common.select",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.monthly",
        "primary.portal.common.yearly",
        "primary.portal.common.dateHint",
        "primary.portal.common.optional",
        "primary.portal.common.total",
        "primary.portal.common.remove",
        "primary.portal.common.requiredField",
        "primary.portal.applicationFlow.oneCharacter",
        "primary.portal.applicationFlow.invalidFormat",
        "primary.portal.pda.form.webexDisclaimer",
        "primary.portal.pda.location.validationMsg",
        "primary.portal.pda.form.employeeInsured",
        "primary.portal.pda.form.paymentAuthorizeContent",
        "primary.portal.pda.form.paymentContent",
        "primary.portal.pda.form.policyNumber",
        "primary.portal.pda.form.totalPremium",
        "primary.portal.pda.form.employerContribution",
        "primary.portal.pda.form.employeeDeduction",
        "primary.portal.pda.form.deductionHeader",
        "primary.portal.pda.form.payrollDepartmentNumber",
        "primary.portal.pda.form.suspendCurrentPayroll",
        "primary.portal.pda.form.CompanyName",
        "primary.portal.pda.form.amountToSuspend",
        "primary.portal.pda.form.dollarSign",
        "primary.portal.pda.form.addNewDeduction",
        "primary.portal.sra.form.applicantInfo",
        "primary.portal.pda.producerApplicantSignature",
        "primary.portal.pda.applicantSignatureLater",
        "primary.portal.common.next",
        "primary.portal.common.back",
        "primary.portal.pda.ssnMasking",
        "primary.portal.pda.form.maxSuspendedAmountLength",
        "primary.portal.pda.form.contributionError",
        "primary.portal.pda.form.invalidPayrollDepartmentNumber",
        "primary.portal.pda.form.invalidDepartmentNumber",
        "primary.portal.pda.form.invalidDate",
        "primary.portal.qle.addNewQle.badParameter",
        "primary.portal.resources.product",
        "primary.portal.pda.form.enterPin",
        "primary.portal.applicationFlow.minthreeCharacters",
        "primary.portal.headset.noemailaddress",
        "primary.portal.headset.nomobile",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.pattern.signature",
        "secondary.portal.common.maxLength50",
        "secondary.portal.register.personalInfo.invalidStringWithHypenApostrophe",
        "secondary.portal.members.personalValidationMsg.lastNameMsg1",
    ]);
    displayedColumns: string[] = [
        "policyName",
        "policyNumber2",
        "totalPremium2",
        "employerContribution2",
        "employeeDeduction2",
        "removeRow",
    ];
    dataSource: MatTableDataSource<PdaPolicy>;
    dataSource2: MatTableDataSource<PdaPolicy>;
    manualAddData: PdaPolicy[] = [];
    validationRegex: RegexDataType;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    enrollmentMethodEnum = EnrollmentMethod;
    locationMinLength: number;
    locationMaxLength: number;
    private readonly unsubscribe$ = new Subject<void>();
    customerHeadsetSignature: string;
    data: PdaData;
    // eslint-disable-next-line id-denylist
    accountDetails: { number: string; name: string };
    isSignatureEnabled = false;
    showPin = false;
    suspendAmountEdit = false;
    readonly SSN_FORMAT = SSN_FORMAT;
    readonly COST_MAX_LENGTH = 10;
    readonly SSN_MAX_LENGTH = 11;
    readonly SSN_MASKED_LENGTH = 5;
    readonly MIDDLE_NAME_MAX_LENGTH = 1;
    nameWithHyphenApostrophesValidation: RegExp;
    isPartiallyMasked: boolean;
    isFullyMasked: boolean;
    isFullyVisible: boolean;
    errorMessage: string;
    unmaskedSSNValue: string;
    policyPremiums: Array<PdaPolicy>;
    contactList: MemberContactListDisplay[] = [];
    memberFirstName: string;
    /**
     * constructor of class
     * @param dialogRef Ref of angular modal dialog
     * @param language Ref of language service
     * @param datePipe Ref of date pipe
     * @param data angular material dialog data
     * @param fb Ref of angular form builder service
     * @param store Ref of ngx store
     * @param memberService Ref of member service
     * @param utilService Ref of util service
     * @param userService Ref of user service
     * @param accountService Ref of account service
     * @param aflacService Ref of aflac service
     * @param maskPipe mask pipe reference
     * @param staticUtilService Ref of static util service
     * @param staticService Ref of static service
     */
    constructor(
        private readonly dialogRef: MatDialogRef<PdaPrComponent>,
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly dialogData: PdaData,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly utilService: UtilService,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
        private readonly aflacService: AflacService,
        private readonly staticUtilService: StaticUtilService,
        private readonly staticService: StaticService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly sharedService: SharedService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly enrollmentService: EnrollmentService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
    ) {
        this.staticService
            .getConfigurations(ConfigName.TELEPHONE_SIGNATURE_PLACEHOLDER, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configurations) => {
                this.customerHeadsetSignature = configurations[0].value;
            });
    }
    /**
     * Angular life cycle hook
     * Taking snapshot of Account list state to get and assigning values to other variables
     * Calling method to get producer details
     * Calling method to define PDA form
     * Calling method get Member form data
     * Calling method to get allowed pda policy names
     * Calling method to disable pda from
     * Calling method to disable signature for pending enrollment
     * Get customer signature from config
     */
    ngOnInit(): void {
        this.data = this.openAs === QUASI ? this.dialogData : this.tpiData;
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.isTpiPRState = params[CompanyCode.PR] === TRUE;
        });
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.producerId = credential.producerId;
        });
        if (this.data.enrollmentType && this.flow !== APP_FLOW) {
            this.enrollmentType = this.data.enrollmentType;
        } else {
            this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
            if (this.enrollmentObj) {
                this.enrollmentType = this.enrollmentObj?.enrollmentMethod;
            }
        }
        this.loadSpinner = false;
        this.producerId = this.data.producerId;
        this.mpGroup = this.data.mpGroupId;
        this.memberId = this.data.memberId;
        this.dataSource2 = new MatTableDataSource<PdaPolicy>(this.manualAddData);
        this.dataSource = new MatTableDataSource<PdaPolicy>(this.manualAddData);
        this.dataSource.data = [];
        this.dataSource2.data = [];
        this.regex$
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((regexResponse: RegexDataType) => regexResponse !== undefined),
                tap((regexResponse: RegexDataType) => {
                    this.validationRegex = regexResponse;
                }),
            )
            .subscribe();
        if (this.producerId && this.data.isOwnAccount) {
            this.getProducerDetails();
        }
        this.getLocationConfig();
        this.nameWithHyphenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.staticUtilService
            .cacheConfigValue(ConfigName.SSN_MASKING_CONFIG)
            .pipe(filter(Boolean))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((config: SSNMask) => {
                this.isPartiallyMasked = config === SSNMask.PARTIALLY_MASKED;
                this.isFullyMasked = config === SSNMask.FULLY_MASKED;
                this.isFullyVisible = config === SSNMask.FULLY_VISIBLE;
            });
        if (this.enrollmentType === this.enrollmentMethodEnum.HEADSET) {
            this.getMemberInfo();
        }
    }
    /**
     * fetch details of member
     */
    getMemberInfo(): void {
        combineLatest([
            this.memberService.getMember(+this.memberId, true, this.mpGroup.toString()),
            this.memberService.getMemberContacts(+this.memberId, this.mpGroup.toString()),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([memberDetails, memberContact]) => {
                this.memberFirstName = memberDetails.body.name.firstName;
                this.contactList = this.utilService.getFormattedMemberContacts(memberContact);
            });
    }

    /**
     * Get location validation rule from config [minLength, maxLength]
     * @returns void
     */
    getLocationConfig(): void {
        combineLatest(
            this.staticUtilService.cacheConfigValue(ConfigName.MIN_LOCATION_LENGTH),
            this.staticUtilService.cacheConfigValue(ConfigName.MAX_LOCATION_LENGTH),
            this.enrollmentService.getEnrollments(parseInt(this.memberId, RADIX_TEN), this.mpGroup),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([locationMinLength, locationMaxLength, enrollments]) => {
                this.locationMinLength = +locationMinLength;
                this.locationMaxLength = +locationMaxLength;
                enrollments
                    .filter((enrollment) => enrollment.status === StatusType.PENDING)
                    .forEach((enrollment) => {
                        this.enrollmentType = this.enrollmentType || enrollment.type;
                        this.data.enrollmentType = this.data.enrollmentType || enrollment.type;
                        // eslint-disable-next-line sonarjs/no-collapsible-if
                        if (this.data.openedFrom !== COVERAGE_SUMMARY) {
                            if (enrollment.type === this.enrollmentMethodEnum.TELEPHONE_ENROLLMENT) {
                                this.data.enrollmentType = this.enrollmentType = this.enrollmentMethodEnum.HEADSET;
                            }
                        }
                    });
                this.definePdaForm();
                this.disablePdaForm();
                this.getMemberFormData();
                this.getAllowedPdaPolicyNames();
                this.disableSignatureForPendingEnrollment();
                this.isConfigAvailable = true;
            });
    }
    /**
     * Fetch logged in producer details
     */
    getProducerDetails(): void {
        forkJoin([
            this.accountService.getAccountProducer(this.producerId.toString(), this.mpGroup),
            this.aflacService.getCommissionSplits(this.mpGroup.toString()),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([producerDetail, commissionSplits]) => {
                const selectedProducer = producerDetail.producer;
                if (selectedProducer.writingNumbers && selectedProducer.writingNumbers.length) {
                    this.writingNumber = this.getWritingNumber(this.producerId, producerDetail, commissionSplits);
                }
                if (selectedProducer.name) {
                    this.producerName = `${selectedProducer.name.firstName} ${selectedProducer.name.lastName}`;
                }
            });
    }

    /**
     * method to get the writing number based on the sitcode of the producer
     * @param id Pproducer id
     * @param electedProducerd selected producer
     * @param commissionSplits commission splits
     * @returns writing number
     */

    getWritingNumber(id: number, selectedProducer: AccountProducer, commissionSplits: CommissionSplit[]): string {
        const commissionSplit = commissionSplits.find(
            (commissionSplitData) => commissionSplitData.defaultFor && commissionSplitData.defaultFor.producerId === id,
        );
        const assignment = commissionSplit?.assignments.find((assignmentData) => assignmentData.producer.producerId === id);
        if (assignment) {
            return selectedProducer.producer.writingNumbers.find((writingNumber) =>
                writingNumber.sitCodes.some((sitCode) => sitCode.id === assignment.sitCodeId),
            )?.number;
        }
        return "";
    }

    /**
     * Method to get member data and call method to set form values
     */
    getMemberFormData(): void {
        this.loadSpinner = true;
        if (this.data.isEditPda && this.data.formId) {
            this.getUnsignedFormData();
        } else {
            this.memberService
                .getMemberFormsByType(+this.memberId, FormType.PDA_PR, this.mpGroup.toString(), NEW)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (res) => {
                        if (res.length) {
                            this.pdaFormData = res[0];
                            this.setFormValues();
                            this.getPayFrequency();
                            this.loadSpinner = false;
                        }
                    },
                    (err) => {
                        this.loadSpinner = false;
                    },
                );
        }
    }
    /**
     * This method fetches the incomplete PDA details
     */
    getUnsignedFormData(): void {
        this.memberService
            .getMemberForm(this.mpGroup.toString(), +this.memberId, FormType.PDA_PR, this.data.formId)
            .pipe(
                tap((formData) => {
                    this.pdaFormData = formData;
                    if (
                        this.pdaFormData.signature === this.customerHeadsetSignature &&
                        this.enrollmentType !== this.enrollmentMethodEnum.FACE_TO_FACE &&
                        this.enrollmentType !== this.enrollmentMethodEnum.VIRTUAL_FACE_TO_FACE
                    ) {
                        this.enrollmentType = this.enrollmentMethodEnum.HEADSET;
                        this.isHeadset = true;
                        this.isSignatureEnabled = false;
                        this.prPDAForm.controls.signature.disable();
                    }
                    this.setFormValues();
                }),
                switchMap((resp) => this.accountService.getPayFrequencies(this.mpGroup.toString())),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((payFrequency) => {
                this.loadSpinner = false;
                this.setPayrollMode(payFrequency);
            });
    }

    /**
     * Method to set payroll mode
     * @param payFrequency pay frequency API response
     */
    setPayrollMode(payFrequency: PayFrequency[]): void {
        if (this.pdaFormData) {
            const payFreq = payFrequency.find((pay) => pay.id === this.pdaFormData.payFrequencyId);
            if (payFreq) {
                this.payrollMode = payFreq.name;
            }
        }
    }

    /**
     * Method to get pay frequency and set payroll mode
     */
    getPayFrequency(): void {
        this.accountService
            .getPayFrequencies(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((payFrequency) => {
                this.setPayrollMode(payFrequency);
            });
    }
    /**
     * method to disable pda form
     */
    disablePdaForm(): void {
        this.prPDAForm.controls.firstName.disable();
        this.prPDAForm.controls.lastName.disable();
        this.prPDAForm.controls.mi.disable();
        this.checkForHeadSetEnrollment();
    }
    /**
     *Method to disable signature based on enrollment type and state
     */
    checkForHeadSetEnrollment(): void {
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (this.enrollmentObj && this.data.state === PR) {
            this.enrollmentType = !(this.enrollmentObj.enrollmentMethod === null || this.enrollmentObj.enrollmentMethod === undefined)
                ? this.data.enrollmentType || this.enrollmentObj.enrollmentMethod
                : "";
            if (this.enrollmentType === this.enrollmentMethodEnum.HEADSET) {
                this.isHeadset = true;
                this.isSignatureEnabled = false;
                this.prPDAForm.controls.signature.disable();
            }
        } else {
            this.enrollmentType = this.data.enrollmentType;
        }
    }

    /**
     * This method is to disable signature based on enrollment method(when pda is incomplete during enrollment)
     */
    disableSignatureForPendingEnrollment(): void {
        const enrollment = this.data.isDocument ? this.data.enrollmentType : this.enrollmentType;
        if (enrollment === this.enrollmentMethodEnum.HEADSET) {
            this.isHeadset = true;
            this.isSignatureEnabled = false;
            this.prPDAForm.controls.signature.disable();
        } else if (enrollment === this.enrollmentMethodEnum.FACE_TO_FACE) {
            this.isSignatureEnabled = true;
            if (this.data.isOwnAccount) {
                this.prPDAForm.controls.signature.enable();
            }
        }
    }

    /**
     * Function to construct the PDA form group and their controls. Also initialized it with data and required validation
     */
    definePdaForm(): void {
        this.prPDAForm = this.fb.group({
            firstName: [],
            lastName: [],
            mi: [],
            ssn: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.minLength(SSN_MIN_LENGTH),
                    Validators.pattern(this.validationRegex.UNMASKSSN),
                ]),
            ],
            insured: [true],
            applicantFirstName: ["", Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)],
            applicantMI: ["", Validators.compose([Validators.maxLength(1), Validators.pattern(this.validationRegex.MIDDLENAME)])],
            applicantLastName: ["", Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)],
            departmentNumber: [
                "",
                Validators.compose([
                    Validators.minLength(DEPARTMENT_LENGTH),
                    Validators.maxLength(DEPARTMENT_LENGTH),
                    Validators.pattern(new RegExp(this.validationRegex.ALPHANUMERIC)),
                ]),
            ],
            location: [
                "",
                [Validators.pattern(this.validationRegex.ALPHANUMERIC_SPECIAL_CHARACTERS), Validators.minLength(this.locationMinLength)],
            ],
            firstDeductionDate: ["", Validators.required],
            signature: [
                "",
                [
                    Validators.required,
                    Validators.pattern(this.validationRegex.ALPHA_WITH_SPACES),
                    Validators.minLength(MIN_SIGNATURE_LENGTH),
                    Validators.maxLength(MAX_SIGNATURE_LENGTH),
                ],
            ],
            policyPremiums: [],
            pdaPolicy: [],
            suspendCurrentPayroll: [false],
            companyName: [
                { value: "", disabled: true },
                [Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED), Validators.minLength(MIN_SIGNATURE_LENGTH)],
            ],
            suspendAmount: [{ value: "", disabled: true }, Validators.pattern(this.validationRegex.NUMBERS_WITH_TWO_DECIMAL)],
            addNewDeduction: [false],
            payrollDepartmentNumber: [
                "",
                Validators.compose([
                    Validators.minLength(DEPARTMENT_MIN_LENGTH),
                    Validators.maxLength(DEPARTMENT_MAX_LENGTH),
                    Validators.pattern(new RegExp(this.validationRegex.ALPHA)),
                ]),
            ],
        });
        this.checkForPinEnrollment();
    }
    /**
     * function to set values into the pda form
     */
    setFormValues(): void {
        const policyData = [] as PdaPolicy[];
        if (this.pdaFormData) {
            this.policyPremiums = this.utilService.copy(this.pdaFormData.policyPremiums);
            this.prPDAForm.patchValue({
                firstName: this.pdaFormData.memberName.firstName,
                mi: this.pdaFormData.memberName.middleName,
                lastName: this.pdaFormData.memberName.lastName,
                ssn: this.pdaFormData.socialSecurityNumber,
                departmentNumber: this.pdaFormData.departmentNumber,
            });
            if (this.data.isEditPda) {
                this.prPDAForm.patchValue({
                    firstDeductionDate: this.pdaFormData.firstDeductionDate,
                    location: this.pdaFormData.location,
                    suspendCurrentPayroll: !!this.pdaFormData.companyToSuspendDeductionFrom,
                    companyName: this.pdaFormData.companyToSuspendDeductionFrom ? this.pdaFormData.companyToSuspendDeductionFrom : "",
                    suspendAmount: this.pdaFormData.suspendedAmount,
                    insured: !this.pdaFormData.applicantName,
                    applicantFirstName: this.pdaFormData.applicantName ? this.pdaFormData.applicantName.firstName : "",
                    applicantMI: this.pdaFormData.applicantName ? this.pdaFormData.applicantName.middleName : "",
                    applicantLastName: this.pdaFormData.applicantName ? this.pdaFormData.applicantName.lastName : "",
                    payrollDepartmentNumber: this.pdaFormData.payrollDepartmentNumber,
                    addNewDeduction: this.pdaFormData.processAsNewDeduction,
                });
                if (this.pdaFormData.companyToSuspendDeductionFrom) {
                    this.prPDAForm.controls.companyName.enable();
                    this.prPDAForm.controls.suspendAmount.enable();
                }
            }
            this.accountDetails = {
                // eslint-disable-next-line id-denylist
                number: this.pdaFormData.payrollAccountNumber,
                name: this.pdaFormData.employerName,
            };
            if (this.policyPremiums.length > 0) {
                this.policyPremiums.forEach((policy) => {
                    const existingPolicyPremiumIndex = policyData.findIndex(
                        (existingPolicy) => policy.policyName === existingPolicy.policyName,
                    );
                    if (existingPolicyPremiumIndex >= 0) {
                        const existingPolicyData = policyData[existingPolicyPremiumIndex];
                        let existingPolicyContribution = policyData[existingPolicyPremiumIndex].employerContribution;
                        existingPolicyData.totalPremium = existingPolicyData.totalPremium + policy.totalPremium;
                        existingPolicyContribution = policy.employerContribution
                            ? existingPolicyContribution + policy.employerContribution
                            : existingPolicyContribution;
                        existingPolicyData.totalPremium = parseFloat(existingPolicyData.totalPremium.toFixed(2));
                        existingPolicyData.employerContribution = parseFloat(existingPolicyContribution.toFixed(2));
                    } else {
                        policy.employerContribution = policy.employerContribution ? policy.employerContribution : AMOUNT_ZERO;
                        policyData.push(policy);
                    }
                });
            }
            this.dataSource.data = policyData.map((policy) => {
                policy.employerContribution = policy.employerContribution ? policy.employerContribution : AMOUNT_ZERO;
                policy.employeeDeduction = policy.totalPremium - policy.employerContribution;
                return policy;
            });
            if (this.dataSource.data.length && this.enrollmentType !== this.enrollmentMethodEnum.HEADSET) {
                this.isSignatureEnabled = true;
                if (this.data.isOwnAccount) {
                    this.prPDAForm.controls.signature.enable();
                }
            }
            if (this.prPDAForm.controls.departmentNumber.value) {
                this.prPDAForm.controls.departmentNumber.disable();
            }
            if (this.prPDAForm.controls.ssn.value) {
                this.prPDAForm.controls.ssn.patchValue(this.maskPipe.transform(this.prPDAForm.controls.ssn.value, SSN_FORMAT));
                this.maskSSN();
                this.prPDAForm.controls.ssn.disable();
            } else {
                this.prPDAForm.controls.ssn.setValidators(
                    Validators.compose([
                        Validators.required,
                        Validators.minLength(SSN_MIN_LENGTH),
                        Validators.pattern(this.validationRegex.UNMASKSSN),
                    ]),
                );
            }
        }
    }

    /**
     *Method to add new form control for pin and check for pin enrollment
     */
    checkForPinEnrollment(): void {
        if (
            this.data.openedFrom === COVERAGE_SUMMARY &&
            (this.data.enrollmentType === EnrollmentMethod.CALL_CENTER || this.data.enrollmentType === EnrollmentMethod.PIN_SIGNATURE)
        ) {
            this.showPin = true;
            this.prPDAForm.addControl(
                "pin",
                new FormControl(
                    {
                        value: this.data.pinDetails?.pin || "",
                        disabled: !!this.data.pinDetails?.pin,
                    },
                    [
                        Validators.required,
                        Validators.minLength(MIN_PIN_LENGTH),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ],
                ),
            );
        }
        if (
            (!(this.data.openedFrom === COVERAGE_SUMMARY) && this.enrollmentType === EnrollmentMethod.CALL_CENTER) ||
            this.enrollmentType === EnrollmentMethod.PIN_SIGNATURE
        ) {
            this.showPin = true;
            this.prPDAForm.addControl(
                "pin",
                new FormControl(
                    {
                        value: this.data.pinDetails && this.data.pinDetails.pin ? this.data.pinDetails.pin : "",
                        disabled: this.data.pinDetails && this.data.pinDetails.pin ? true : false,
                    },
                    [
                        Validators.required,
                        Validators.minLength(MIN_PIN_LENGTH),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ],
                ),
            );
        }
    }
    /**
     *Method to set payload and make service call to save PDA
     */
    onSubmit(): void {
        this.errorMessage = null;
        this.isSubmitted = true;
        if (this.showPin) {
            this.prPDAForm.get("signature").disable();
        }
        if (!this.checkForErrorField() && this.prPDAForm.valid) {
            this.loadSpinner = true;
            this.setDataValue();
            if (this.enrollmentType) {
                this.pdaFormValues.submissionMethod = this.enrollmentType;
                this.pdaFormValues.enrollmentState = this.enrollmentObj?.enrollmentStateAbbreviation;
            } else if (this.enrollmentObj) {
                this.pdaFormValues.submissionMethod = this.enrollmentObj.enrollmentMethod;
                this.pdaFormValues.enrollmentState =
                    this.enrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET
                        ? this.enrollmentObj.headSetStateAbbreviation
                        : this.enrollmentObj.enrollmentStateAbbreviation;
            } else {
                this.pdaFormValues.submissionMethod = EnrollmentMethod.FACE_TO_FACE;
            }
            // Checks if modal has data
            // If modal data exists the state to be passed as part of payload to createMemberFormByType
            if (this.dialogData?.state) {
                this.pdaFormValues.enrollmentState = this.dialogData?.state;
            }
            this.setEnrollmentStateForTPI();
            if (this.data.isEditPda && this.data.formId) {
                this.updateMemberData();
            } else if (this.pdaFormValues.policyPremiums.length || this.data.isDocument) {
                this.createMemberForm();
            }
        }
    }

    /**
     * Sets enrollment state for TPI when accessed via PDA Forms or TPI enrollment flow
     */

    private setEnrollmentStateForTPI(): void {
        if (!this.enrollmentObj?.enrollmentStateAbbreviation && !this.dialogData?.state) {
            if (this.tpiData?.state) {
                this.pdaFormValues.enrollmentState = this.tpiData?.state;
            } else if (!this.isTpiPRState) {
                // If being accessed by PDA forms and queryParams have PR=false
                this.pdaFormValues.enrollmentState = this.pdaFormData?.memberAddress?.state;
            } else {
                // If being accessed by PDA forms and queryParams have PR=true
                this.pdaFormValues.enrollmentState = CompanyCode.PR;
            }
        }
    }

    /**
     * update member form and close the dialog
     */
    updateMemberData(): void {
        this.memberService
            .updateMemberForm(this.mpGroup.toString(), +this.memberId, FormType.PDA_PR, this.data.formId, this.pdaFormValues)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.loadSpinner = false;
                    this.utilService.updateFormSubmission(FormType.PDA_PR, true);
                    this.dialogRef.close(true);
                },
                (err) => {
                    if (err.error.status === ClientErrorResponseCode.RESP_400 && err.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                        this.errorMessage = this.languageStrings["primary.portal.qle.addNewQle.badParameter"];
                    }
                    this.loadSpinner = false;
                },
            );
    }

    /**
     * create member form by type and create member note
     */
    createMemberForm(): void {
        this.memberService
            .createMemberFormByType(+this.memberId, this.pdaFormValues, FormType.PDA_PR, this.mpGroup.toString())
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => {
                    const respHeaderLocation = res.headers.get(LOCATION);
                    const eleArray = respHeaderLocation.split("/");
                    const pdaId = +eleArray[eleArray.length - 1];
                    return this.createMemberNote(pdaId);
                }),
                switchMap(() => {
                    this.loadSpinner = false;
                    if (
                        this.pdaFormValues.submissionMethod === EnrollmentMethod.HEADSET &&
                        this.flow === APP_FLOW &&
                        !this.data.isEditPda
                    ) {
                        return this.empoweredModalService
                            .openDialog(SendApplicantPdaComponent, {
                                data: {
                                    contactList: this.contactList,
                                    firstName: this.memberFirstName,
                                },
                            })
                            .afterClosed();
                    }
                    return of(null);
                }),
                switchMap((response) => {
                    this.utilService.updateFormSubmission(FormType.PDA_PR, true);
                    if (this.flow === APP_FLOW) {
                        this.sharedService.appFlowPDASubmitted(true);
                        if (response?.action === "send") {
                            const requestData =
                                response.selectedValue.type === ContactMethodTypes.EMAIL.toLowerCase()
                                    ? { email: response.selectedValue.contact }
                                    : { phoneNumber: response.selectedValue.contact };
                            return this.shoppingCartService.requestShoppingCartSignature(
                                this.mpGroup,
                                +this.memberId,
                                requestData,
                                PendingReasonForPdaCompletion.PDA,
                            );
                        }
                    }
                    if (this.flow !== APP_FLOW && this.openAs !== QUASI) {
                        this.router.navigate(["../view"], {
                            relativeTo: this.route,
                        });
                    } else if (this.openAs === QUASI) {
                        this.dialogRef.close(true);
                    }
                    return of(null);
                }),
            )
            .subscribe(
                () => {},
                (err) => {
                    if (err.error.status === ClientErrorResponseCode.RESP_400 && err.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                        this.errorMessage = this.languageStrings["primary.portal.qle.addNewQle.badParameter"];
                    }
                    this.loadSpinner = false;
                },
            );
    }

    /**
     * Method to create member note
     * @param pdaId PDA ID number
     * @returns API response
     */
    createMemberNote(pdaId: number): Observable<null> {
        const payload = {
            formInfo: {
                id: pdaId,
                type: FormType.PDA_PR,
            },
        };
        return this.memberService.createMemberNote(this.memberId, this.mpGroup.toString(), payload);
    }
    /**
     *Function to set payload for PDA form
     */
    setDataValue(): void {
        this.pdaFormValues = {
            employerName: this.accountDetails.name,
            memberName: {
                firstName: this.prPDAForm.controls.firstName.value,
                middleName: this.prPDAForm.controls.mi.value,
                lastName: this.prPDAForm.controls.lastName.value,
            },
            socialSecurityNumber: this.unmaskedSSNValue,
            memberAddress: this.pdaFormData.memberAddress,
            departmentNumber: this.prPDAForm.controls.departmentNumber.value ? this.prPDAForm.controls.departmentNumber.value : null,
            payrollDepartmentNumber: this.prPDAForm.controls.payrollDepartmentNumber.value
                ? this.prPDAForm.controls.payrollDepartmentNumber.value
                : null,
            location: this.prPDAForm.controls.location.value ? this.prPDAForm.controls.location.value : null,
            firstDeductionDate: this.prPDAForm.controls.firstDeductionDate.value
                ? this.datePipe.transform(this.prPDAForm.controls.firstDeductionDate.value, DateFormats.YEAR_MONTH_DAY)
                : null,
            payrollAccountNumber: this.accountDetails.number,
            policyPremiums: this.pdaFormData.policyPremiums,
            payFrequencyId: this.pdaFormData.payFrequencyId,
            companyToSuspendDeductionFrom: this.prPDAForm.controls.suspendCurrentPayroll.value
                ? this.prPDAForm.controls.companyName.value
                : null,
            suspendedAmount: this.prPDAForm.controls.suspendCurrentPayroll.value ? +this.prPDAForm.controls.suspendAmount.value : null,
            processAsNewDeduction: this.prPDAForm.controls.addNewDeduction.value,
        };
        if (this.showPin) {
            this.pdaFormValues.pin = this.prPDAForm.controls.pin.value;
        } else {
            const signature = this.prPDAForm.controls.signature.value;
            this.pdaFormValues.signature = this.enrollmentType === EnrollmentMethod.HEADSET ? this.customerHeadsetSignature : signature;
        }
        if (!this.prPDAForm.controls.insured.value) {
            this.pdaFormValues.applicantName = {
                firstName: this.prPDAForm.controls.applicantFirstName.value,
                middleName: this.prPDAForm.controls.applicantMI.value,
                lastName: this.prPDAForm.controls.applicantLastName.value,
            };
        }
        this.dataSource2.data.forEach((res) => {
            const policy = {
                policyName: res.policyName,
                policyNumber: res.policyNumber,
                totalPremium: res.totalPremium,
                employerContribution: res.employerContribution,
                employeeDeduction: res.employeeDeduction,
            };
            this.pdaFormValues.policyPremiums.push(policy);
        });
    }

    /**
     * Method to get pda policy names
     */
    getAllowedPdaPolicyNames(): void {
        this.allowedPdaPolicyNames.push(SELECT);
        this.aflacService
            .getAllowedPdaPolicyNames()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.allowedPdaPolicyNames.push(...resp);
            });
    }

    /**
     * Method to check policy selected and call method to set data source
     * @param policy policy selected
     */
    onPolicySelection(policy: string): void {
        const planLength = this.dataSource2.data.length;
        this.checkForErrorField();
        if (planLength > 0 && this.dataSource2.data[planLength - 1].oneFieldReqError !== true) {
            if (policy !== SELECT && !(policy === null || policy === undefined)) {
                this.setPolicyDataSource(policy);
            }
        } else if (planLength === 0 && policy !== SELECT && !(policy === null || policy === undefined)) {
            this.setPolicyDataSource(policy);
        }
    }

    /**
     * set policy data
     * @param policy selected policy details
     */
    setPolicyDataSource(policy: string): void {
        this.dataSource2.data.push({
            policyName: policy,
            employeeDeduction: 0.0,
        });
        this.dataSource2 = new MatTableDataSource(this.dataSource2.data);
        if (this.enrollmentType !== EnrollmentMethod.HEADSET) {
            this.isSignatureEnabled = true;
            if (this.data.isOwnAccount) {
                this.prPDAForm.controls.signature.enable();
            }
        }
        this.prPDAForm.controls.pdaPolicy.setValue(SELECT);
    }

    /**
     * checks validation of form fields
     * @returns error flag
     */
    checkForErrorField(): boolean {
        const planLength = this.dataSource.data.length;
        const planLength1 = this.dataSource2.data.length;
        const pdaPolicyFormControl = this.prPDAForm.controls.pdaPolicy;
        if (planLength || planLength1) {
            this.errorFieldFlag = false;
            pdaPolicyFormControl.setErrors(null);
            this.checkPlanAndPDA(planLength1, pdaPolicyFormControl);
        } else {
            this.errorFieldFlag = true;
            pdaPolicyFormControl.setErrors({ required: true });
        }
        return this.errorFieldFlag;
    }

    /**
     * Method to set pda policy based on user selection
     * @param planLength1 - check is any plan exist
     * @param pdaPolicyFormControl pda Policy form control
     */
    checkPlanAndPDA(planLength1: number, pdaPolicyFormControl: AbstractControl): void {
        const selectLiteral = this.languageStrings["primary.portal.common.select"];
        const plan = this.dataSource2.data[planLength1 - 1];
        if (plan && !plan.totalPremium) {
            plan.oneFieldReqError = true;
            this.errorFieldFlag = true;
            pdaPolicyFormControl.setValue(selectLiteral);
        } else if (plan && plan.employeeDeduction < 0) {
            this.errorFieldFlag = true;
        } else if (plan) {
            plan.oneFieldReqError = false;
            this.errorFieldFlag = false;
        }
    }

    /**
     * Method to remove policy
     * @param removePolicyIndex is policy data index to be removed
     */
    removePolicy(removePolicyIndex: number): void {
        const dataCopy = Object.assign(this.dataSource2.data);
        dataCopy.splice(removePolicyIndex, 1);
        this.dataSource2 = new MatTableDataSource(dataCopy);
        if (!this.dataSource2.data.length && !this.dataSource.data.length && this.data.isDocument) {
            this.isSignatureEnabled = false;
            this.prPDAForm.controls.signature.disable();
        }
    }

    /**
     * Method to update error field
     * @param element Pda policy element
     */
    updateErrorField(plan: PdaPolicy): void {
        plan.employerDeductionError = false;
        if (plan.oneFieldReqError) {
            if (plan.totalPremium && plan.employeeDeduction >= 0) {
                plan.oneFieldReqError = false;
                this.errorFieldFlag = false;
            } else {
                plan.employerDeductionError = plan.employeeDeduction < 0;
                plan.oneFieldReqError = !plan.totalPremium;
                this.errorFieldFlag = true;
            }
        } else if (plan && plan.employeeDeduction < 0) {
            this.errorFieldFlag = true;
            plan.employerDeductionError = true;
        }
    }

    /**
     * Method to update employee deduction amount
     * @param pdaData pda policy data
     * @param index pda policy index
     */
    updateEmployeeDeduction(pdaData: PdaPolicy, index: number): void {
        pdaData.employerDeductionError = false;
        if (pdaData.totalPremium) {
            this.dataSource2.data[index].employerContribution = pdaData.employerContribution ? pdaData.employerContribution : 0.0;
            this.dataSource2.data[index].employeeDeduction =
                this.dataSource2.data[index].totalPremium - this.dataSource2.data[index].employerContribution;
            this.updateErrorField(pdaData);
        } else {
            pdaData.employeeDeduction = null;
        }
    }

    /**
     * Method to set/clear validators to applicant information based on employee insured checkbox value
     * @param event Mat-Checkbox event
     */
    modifyEmployeeInsured(event: MatCheckboxChange): void {
        if (event.checked) {
            this.prPDAForm.controls.applicantFirstName.clearValidators();
            this.prPDAForm.controls.applicantLastName.clearValidators();
            this.prPDAForm.controls.applicantFirstName.setErrors(null);
            this.prPDAForm.controls.applicantLastName.setErrors(null);
        } else {
            this.prPDAForm.controls.applicantFirstName.setValidators([Validators.required, Validators.pattern(this.validationRegex.NAME)]);
            this.prPDAForm.controls.applicantLastName.setValidators([Validators.required, Validators.pattern(this.validationRegex.NAME)]);
        }
        this.prPDAForm.updateValueAndValidity();
    }

    /**
     * Method to set/clear validators to applicant information based on employee insured checkbox value
     * @param event Mat-Checkbox event
     */
    suspendCurrentPayroll(event: MatCheckboxChange): void {
        if (event.checked) {
            this.prPDAForm.controls.companyName.setValidators([
                Validators.required,
                Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED),
                Validators.minLength(MIN_SIGNATURE_LENGTH),
            ]);
            this.prPDAForm.controls.suspendAmount.setValidators(
                Validators.compose([Validators.required, Validators.pattern(this.validationRegex.NUMBERS_WITH_TWO_DECIMAL)]),
            );
            this.prPDAForm.controls.companyName.enable();
            this.prPDAForm.controls.suspendAmount.enable();
        } else {
            this.prPDAForm.controls.companyName.disable();
            this.prPDAForm.controls.suspendAmount.disable();
        }
        this.prPDAForm.updateValueAndValidity();
    }

    /**
     * Method to format suspend amount
     */
    suspendAmountChange(): void {
        this.suspendAmountEdit = false;
        this.prPDAForm.controls.suspendAmount.setValue(parseFloat(this.prPDAForm.controls.suspendAmount.value).toFixed(FIXING_VALUE));
        this.prPDAForm.updateValueAndValidity();
    }

    /**
     * Method to mask SSN
     */
    maskSSN(): void {
        const unmaskedUserInput = this.prPDAForm.controls.ssn.value;
        let maskedSSNValue: string;
        if (unmaskedUserInput) {
            this.prPDAForm.controls.ssn.setValidators(
                Validators.compose([
                    Validators.required,
                    Validators.minLength(SSN_MIN_LENGTH),
                    Validators.pattern(this.validationRegex.UNMASKSSN),
                ]),
            );
            this.prPDAForm.controls.ssn.markAsTouched({ onlySelf: true });
            this.prPDAForm.controls.ssn.updateValueAndValidity();
        }
        this.isFullyVisible = !this.prPDAForm.controls.ssn.valid || !(this.isPartiallyMasked || this.isFullyMasked);
        const ssnFormValue = unmaskedUserInput ? unmaskedUserInput.replace(/-/g, "") : "";
        if (ssnFormValue.length === SSN_MIN_LENGTH && !this.isFullyVisible && this.prPDAForm.controls.ssn.valid) {
            let tempMask = "";
            const SsnFormValue = this.prPDAForm.controls.ssn.value.replace(/-/g, "");
            if (SsnFormValue !== this.unmaskedSSNValue) {
                const lengthUnmaskedSSN = SsnFormValue.length;
                tempMask = `${this.languageStrings["primary.portal.pda.ssnMasking"]}${SsnFormValue.slice(
                    this.SSN_MASKED_LENGTH,
                    lengthUnmaskedSSN,
                )}`;
                maskedSSNValue = tempMask;
                this.unmaskedSSNValue = SsnFormValue;
                this.prPDAForm.controls.ssn.setValue(maskedSSNValue);
                this.prPDAForm.controls.ssn.clearValidators();
                this.prPDAForm.controls.ssn.setErrors(null);
                this.prPDAForm.controls.ssn.setValidators(Validators.compose([Validators.required, Validators.minLength(SSN_MIN_LENGTH)]));
                this.prPDAForm.controls.ssn.updateValueAndValidity();
            }
        } else if (this.prPDAForm.controls.ssn.value === "") {
            this.isFullyVisible = true;
        }
    }

    /**
     * Method to validate name pattern and set errors
     * @param controlName form control name
     */
    validateNamePattern(controlName: string): void {
        const patternValidation = this.nameWithHyphenApostrophesValidation.test(this.prPDAForm.controls[controlName].value);
        if (patternValidation) {
            this.prPDAForm.controls[controlName].setErrors({ pattern: true, hyphenPattern: true });
        } else if (this.prPDAForm.controls[controlName].value && !this.prPDAForm.controls[controlName].errors) {
            this.prPDAForm.controls[controlName].setErrors(null);
        } else if (!this.prPDAForm.controls[controlName].value) {
            this.prPDAForm.controls[controlName].setErrors({ required: true });
        }
    }
    /**
     * Method to close pda form
     */
    closePRPdaForm(): void {
        this.dialogRef.close(false);
    }

    /**
     * method called on back button click
     */
    onBack(): void {
        this.router.navigate(["../view"], {
            relativeTo: this.route,
        });
    }

    /**
     * restricts to digits and decimal input
     * @param event holds the keyup event object
     * @param index index value of the event
     * @param field name to the field being modified
     * return false if numbers not entered as 8 digits and upto 2 decimal point
     */
    restrictNegativeValue(value: string, index: number, field: string): boolean {
        this.dataSource2.data[index][field] = value.replace(new RegExp(this.validationRegex.LEADING_ZEROS), "");
        if (!new RegExp(this.validationRegex.NUMBERS_WITH_TWO_DECIMAL).test(value)) {
            this.dataSource2.data[index][field] = value.slice(0, -1);
            return false;
        }
        return true;
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
