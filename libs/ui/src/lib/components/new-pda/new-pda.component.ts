import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Subscription, Observable, combineLatest, iif, of, Subject } from "rxjs";
import { FormBuilder, Validators, FormGroup, FormControl, AbstractControl } from "@angular/forms";
import { MemberService, EnrollmentService, AccountService, AflacService, StaticService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { PdaForm, FormType } from "@empowered/api";
import { NgxMaskPipe } from "ngx-mask";
import { tap, filter, switchMap, map, catchError, takeUntil } from "rxjs/operators";
import { UserService } from "@empowered/user";
import {
    ConfigName,
    PayFrequency,
    CompanyCode,
    AppSettings,
    AccountProducer,
    EnrollmentMethod,
    ProducerCredential,
    Enrollments,
    StatusType,
} from "@empowered/constants";
import { StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { AccountListState, EnrollmentMethodState, EnrollmentMethodModel, SharedState, RegexDataType } from "@empowered/ngxs-store";

const MIN_SIGNATURE_LENGTH = 2;
const MAX_SIGNATURE_LENGTH = 50;
const SIGNATURE = "signature";
const SIGNATURE_2 = "signature2";
const AFLAC_POLICY = "isAflac";
const MIN_LOCATION_LENGTH = "general.data.group_name.length.minimum";
const MAX_LOCATION_LENGTH = "general.data.group_name.length.maximum";
const PIN = "pin";
const PIN_2 = "pin2";
const LIFE = "Life";
const DEPENDENT_POLICY_INDEX = 3;
const EMPLOYEE = "Employee";
const MIN_PIN_LENGTH = 3;

export interface PdaPolicyInfo {
    policyName: string;
    subPolicyName?: string;
    oldPreTax?: number;
    oldPostTax?: number;
    newPreTax?: number;
    newPostTax?: number;
    oneFieldReqError?: boolean;
    newEnrollmentId?: number;
}
let ELEMENT_DATA: PdaPolicyInfo[];
@Component({
    selector: "empowered-new-pda",
    templateUrl: "./new-pda.component.html",
    styleUrls: ["./new-pda.component.scss"],
})
export class NewPdaComponent implements OnInit, OnDestroy {
    pdaFormData: PdaForm;
    producerId: number;
    pdaFormValues: PdaForm = {} as PdaForm;
    pdaForm: FormGroup;
    isMember = false;
    portal = "";
    enrollmentObj: EnrollmentMethodModel;
    memberId: any;
    totalOldPreCost = 0.0;
    totalOldPostCost = 0.0;
    totalNewPreCost = 0.0;
    totalNewPostCost = 0.0;
    hasOldPreTax = false;
    hasOldPostTax = false;
    hasNewPreTax = false;
    hasNewPostTax = false;
    isAflac = false;
    isNotAflac = false;
    mpGroup: number;
    loadSpinner: boolean;
    MemberInfo: any;
    producerSearchList: any;
    options = [];
    allowedPdaPolicyNames: string[] = [];
    minDate = new Date();
    producerName: string;
    writingNumber: string;
    telephoneNumber: string;
    payrollMode: string;
    pdaPolicy: string;
    isHeadset: boolean;
    enrollmentMethod: string;
    isSubmitted = false;
    dataCopy;
    errorFieldFlag = false;
    primaryProducer: AccountProducer[];
    isConfigAvailable = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pda.form.pdaTitle",
        "primary.portal.pda.form.paymentInfo",
        "primary.portal.pda.form.employeeInfo",
        "primary.portal.pda.form.waiverPart",
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
        "primary.portal.pda.form.employerName",
        "primary.portal.pda.form.employerAccount",
        "primary.portal.pda.form.employeeSign",
        "primary.portal.pda.form.producerName",
        "primary.portal.pda.form.date",
        "primary.portal.pda.form.writingNumber",
        "primary.portal.pda.form.telephoneNumber",
        "primary.portal.pda.form.herebyAuthorizeText",
        "primary.portal.pda.form.additionUnderstandText",
        "primary.portal.pda.form.certifyFeaturesText",
        "primary.portal.pda.form.customerSignLater",
        "primary.portal.pda.form.understandPoliciesText",
        "primary.portal.pda.form.notAflacRadioText",
        "primary.portal.pda.form.aflacRadioText",
        "primary.portal.pda.form.policyName",
        "primary.portal.pda.form.policyOld",
        "primary.portal.pda.form.policyNew",
        "primary.portal.pda.form.pretax",
        "primary.portal.pda.form.afterTax",
        "primary.portal.pda.form.atleastOneField",
        "primary.portal.pda.form.signRequired",
        "primary.portal.pda.form.signWaiverRequired",
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
        "primary.portal.pda.applicantSignatureLater",
        "primary.portal.pda.producerApplicantSignature",
        "primary.portal.pda.producerAccountSign",
        "primary.portal.pda.form.enterPin",
        "primary.portal.applicationFlow.minthreeCharacters",
        "primary.portal.members.workLabel.newDepartmentIdHint",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.pattern.signature",
        "secondary.portal.common.maxLength50",
        "secondary.portal.members.workValidationMsg.newDepartmentError",
    ]);
    displayedColumns: string[] = ["policyName", "oldPreTax", "oldPostTax", "newPreTax", "newPostTax", "removeRow"];
    dataSource: MatTableDataSource<PdaPolicyInfo>;
    dataSource2: MatTableDataSource<PdaPolicyInfo>;
    manualAddData: PdaPolicyInfo[] = [];
    SSN_FORMAT = "000-00-0000";
    validationRegex: RegexDataType;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    enrollmentMethodEnum = EnrollmentMethod;
    // Min characters allowed for location
    locationMinLength: number;
    // Max characters allowed for location
    locationMaxLength: number;
    customerHeadsetSignature: string;
    isSignatureEnabled = false;
    isSignature2Enabled = false;
    showPin = false;
    showPRStateForm = this.data.state && this.data.state === CompanyCode.PR;
    enrollmentList: Enrollments[] = [];
    maxNewDeptIdLength = 4;

    enrollments$: Observable<Enrollments[]> = this.enrollmentService.getEnrollments(this.data.memberId, this.data.mpGroupId);
    private readonly unsubscribe$ = new Subject<void>();

    /**
     * constructor of class
     * @param dialogRef Ref of angular modal dialog
     * @param language Ref of language service
     * @param datePipe Ref of date pipe
     * @param data angular material dialog data
     * @param fb Ref of angular form builder service
     * @param store Ref of ngx store
     * @param memberService Ref of member service
     * @param enrollmentService Ref of enrollment service
     * @param utilService Ref of util service
     * @param userService Ref of user service
     * @param accountService Ref of account service
     * @param aflacService Ref of aflac service
     * @param maskPipe mask pipe reference
     * @param staticUtilService Ref of static util service
     * @param staticService Ref of static service
     */
    constructor(
        private readonly dialogRef: MatDialogRef<NewPdaComponent>,
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly enrollmentService: EnrollmentService,
        private readonly utilService: UtilService,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
        private readonly aflacService: AflacService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly staticUtilService: StaticUtilService,
        private readonly staticService: StaticService,
    ) {
        this.isHeadset = false;
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
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (!this.showPRStateForm) {
            if (this.data.enrollmentType) {
                this.enrollmentMethod = this.data.enrollmentType;
            } else {
                if (this.enrollmentObj) {
                    this.enrollmentMethod = this.enrollmentObj.enrollmentMethod ?? "";
                }
            }
            this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
                this.producerId = credential.producerId;
            });
            this.producerId = this.data.producerId;
            this.mpGroup = this.data.mpGroupId;
            this.memberId = this.data.memberId;
            this.dataSource2 = new MatTableDataSource<PdaPolicyInfo>(this.manualAddData);
            this.dataSource = new MatTableDataSource<PdaPolicyInfo>(this.manualAddData);
            this.dataSource.data = [];
            this.dataSource2.data = [];
            this.regex$
                .pipe(
                    filter((regexResponse: RegexDataType) => regexResponse !== undefined),
                    tap((regexResponse: RegexDataType) => {
                        this.validationRegex = regexResponse;
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
            if (this.producerId && this.data.isOwnAccount) {
                this.getProducerDetails();
            }
            this.staticService
                .getConfigurations(ConfigName.TELEPHONE_SIGNATURE_PLACEHOLDER, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((configurations) => {
                    if (configurations.length) {
                        this.customerHeadsetSignature = configurations[0].value;
                    }
                });
        }
        this.loadSpinner = false;
        this.getLocationConfig();
    }

    /**
     * Get location validation rule from config [minLength, maxLength]
     * @returns void
     */
    getLocationConfig(): void {
        combineLatest([
            this.staticUtilService.cacheConfigValue(MIN_LOCATION_LENGTH),
            this.staticUtilService.cacheConfigValue(MAX_LOCATION_LENGTH),
            this.enrollments$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([locationMinLength, locationMaxLength, enrollments]) => {
                if (!this.showPRStateForm) {
                    this.locationMinLength = +locationMinLength;
                    this.locationMaxLength = +locationMaxLength;
                    this.enrollmentList = enrollments;
                    // enable applicant signature when no enrollment is present
                    if (enrollments?.length) {
                        enrollments
                            .filter((enrollment) => enrollment.status === StatusType.PENDING)
                            .forEach((enrollment) => {
                                if (!this.data.enrollmentType) {
                                    this.enrollmentMethod = enrollment.type;
                                    this.data.enrollmentType = enrollment.type;
                                }
                                if (enrollment.type === this.enrollmentMethodEnum.TELEPHONE_ENROLLMENT) {
                                    this.data.enrollmentType = this.enrollmentMethod = this.enrollmentMethodEnum.HEADSET;
                                }
                            });
                    }
                    this.definePdaForm();
                    this.disablePdaForm();
                    this.getMemberFormData();
                    this.getAllowedPdaPolicyNames();
                    this.disableSignatureForPendingEnrollment();
                }
                this.isConfigAvailable = true;
            });
    }
    /**
     * Fetch logged in producer details
     */
    getProducerDetails(): void {
        this.accountService
            .getAccountProducer(this.producerId.toString(), this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((producerDetail) => {
                const selectedProducer = producerDetail.producer;
                if (selectedProducer.writingNumbers) {
                    this.writingNumber = selectedProducer.writingNumbers[0].number;
                }
                if (selectedProducer.name) {
                    this.producerName = `${selectedProducer.name.firstName} ${selectedProducer.name.lastName}`;
                }
                if (selectedProducer.phoneNumber) {
                    this.telephoneNumber = selectedProducer.phoneNumber;
                }
            });
    }

    /**
     * This method fetches the enrollment information and PDA details
     */
    getMemberFormData(): void {
        this.loadSpinner = true;
        iif(
            () => this.data.isEditPda && !!this.data.formId,
            this.memberService.getMemberForm(this.mpGroup.toString(), this.memberId, FormType.PDA, this.data.formId),
            this.memberService
                .getMemberFormsByType(this.memberId, FormType.PDA, this.mpGroup.toString(), "NEW")
                .pipe(map((data: PdaForm[]) => (data.length ? data[0] : null))),
        )
            .pipe(
                tap((formData) => {
                    this.pdaFormData = formData;
                    this.setFormValues(this.pdaFormData);
                }),
                switchMap((_) => this.getPayFrequency()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => (this.loadSpinner = false),
                () => (this.loadSpinner = false),
            );
    }

    /**
     * Method to fetch PayFrequency data and set user payroll mode
     * @returns Observable of PayFrequency array
     */
    getPayFrequency(): Observable<PayFrequency[]> {
        return this.accountService.getPayFrequencies(this.mpGroup.toString()).pipe(
            tap((payFrequency) => {
                if (this.pdaFormData) {
                    const payFreq = payFrequency.find((x) => x.id === this.pdaFormData.payFrequencyId);
                    if (payFreq) {
                        this.payrollMode = payFreq.name;
                    }
                }
            }),
        );
    }

    /**
     * method to disable pda form
     */
    disablePdaForm(): void {
        this.pdaForm.get("ssn").disable();
        this.pdaForm.get("employerName").disable();
        this.pdaForm.get("employerPayrollAccountNumber").disable();
        this.pdaForm.get("firstName").disable();
        this.pdaForm.get("lastName").disable();
        this.pdaForm.get("mi").disable();
        if (this.enrollmentMethod === this.enrollmentMethodEnum.HEADSET) {
            this.checkForHeadSetEnrollment();
        }
    }
    /**
     *@description will check for headset enrollment and enrollment state based on that disable signature and signature2.
     */
    checkForHeadSetEnrollment(): void {
        this.isHeadset = true;
        this.pdaForm.get(SIGNATURE).disable();
        this.pdaForm.get(SIGNATURE_2).disable();
        this.isSignatureEnabled = false;
        this.isSignature2Enabled = false;
    }

    /**
     * This method is to disable signature based on enrollment method(when pda is incomplete during enrollment)
     */
    disableSignatureForPendingEnrollment(): void {
        if (!this.data.isDocument && this.enrollmentMethod === this.enrollmentMethodEnum.FACE_TO_FACE) {
            this.isSignatureEnabled = true;
            if (this.data.isOwnAccount) {
                this.pdaForm.get(SIGNATURE).enable();
            }
        }
        if (this.data.enrollmentType === AppSettings.HEADSET) {
            this.isHeadset = true;
            this.isSignatureEnabled = false;
            this.isSignature2Enabled = false;
            this.pdaForm.get(SIGNATURE).disable();
            this.pdaForm.get(SIGNATURE_2).disable();
        } else if (this.data.enrollmentType === this.enrollmentMethodEnum.FACE_TO_FACE) {
            this.isSignatureEnabled = true;
            if (this.data.isOwnAccount) {
                this.pdaForm.get(SIGNATURE).enable();
            }
        }
    }

    /**
     * Function to construct the PDA form group and their controls. Also initialized it with data and required validation
     * @returns void
     */
    definePdaForm(): void {
        this.pdaForm = this.fb.group({
            ssn: [],
            employerName: [],
            employerPayrollAccountNumber: [],
            firstName: [],
            lastName: [],
            mi: [],
            signature: [
                "",
                [
                    Validators.required,
                    Validators.pattern(this.validationRegex.E_SIGNATURE),
                    Validators.minLength(MIN_SIGNATURE_LENGTH),
                    Validators.maxLength(MAX_SIGNATURE_LENGTH),
                ],
            ],
            departmentNumber: ["", Validators.pattern(this.validationRegex.DEPARTMENT_ID)],
            location: [
                "",
                [Validators.pattern(this.validationRegex.ALPHANUMERIC_SPECIAL_CHARACTERS), Validators.minLength(this.locationMinLength)],
            ],
            firstDeductionDate: ["", Validators.required],
            payrollAccountNumber: [],
            policyPremiums: [],
            telephoneNumber: [],
            pdaPolicy: [],
            signature2: [
                "",
                [
                    Validators.required,
                    Validators.pattern(this.validationRegex.E_SIGNATURE),
                    Validators.minLength(MIN_SIGNATURE_LENGTH),
                    Validators.maxLength(MAX_SIGNATURE_LENGTH),
                ],
            ],
            isAflac: [],
        });
        this.checkForPinEnrollment();
        this.enrollments$
            .pipe(
                filter((enrollments) => !enrollments?.length),
                // only disable radio buttons when the user has no enrollments
                tap(() => this.pdaForm?.get(AFLAC_POLICY).disable()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     *@description will check for pin enrollment based on that add new form control for pin.
     */
    checkForPinEnrollment(): void {
        if (this.enrollmentMethod === EnrollmentMethod.CALL_CENTER || this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE) {
            this.showPin = true;
            this.pdaForm.addControl(
                PIN,
                new FormControl({ value: "", disabled: true }, [
                    Validators.required,
                    Validators.minLength(MIN_PIN_LENGTH),
                    Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                ]),
            );
            this.pdaForm.addControl(
                PIN_2,
                new FormControl({ value: "", disabled: true }, [
                    Validators.required,
                    Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                ]),
            );
        }
    }
    /**
     * function to set values into the pda form
     * @param pdaFormData - data from service to be filled in the form
     */
    // eslint-disable-next-line complexity
    setFormValues(pdaFormData: PdaForm): void {
        const policyData = [] as PdaPolicyInfo[];
        if (this.pdaFormData) {
            this.pdaForm.patchValue({
                firstName: this.pdaFormData.memberName.firstName,
                mi: this.pdaFormData.memberName.middleName,
                lastName: this.pdaFormData.memberName.lastName,
                employerName: this.pdaFormData.employerName,
                ssn: this.pdaFormData.socialSecurityNumber,
                employerPayrollAccountNumber: this.pdaFormData.payrollAccountNumber,
            });
            if (this.data.isEditPda) {
                this.pdaForm.patchValue({
                    departmentNumber: this.pdaFormData.departmentNumber,
                    firstDeductionDate: this.pdaFormData.firstDeductionDate,
                    location: this.pdaFormData.location,
                });
            }
            if (this.pdaFormData.policyPremiums.length > 0) {
                ELEMENT_DATA = this.pdaFormData.policyPremiums.slice();
                if (this.pdaFormData) {
                    ELEMENT_DATA.forEach((element) => {
                        if (element.policyName !== "Life") {
                            if (element.newPreTax) {
                                this.totalNewPreCost = this.totalNewPreCost + element.newPreTax;
                                this.hasNewPreTax = true;
                            }
                            if (element.newPostTax) {
                                this.totalNewPostCost = this.totalNewPostCost + element.newPostTax;
                                this.hasNewPostTax = true;
                            }
                            if (element.oldPostTax) {
                                this.totalOldPostCost = this.totalOldPostCost + element.oldPostTax;
                                this.hasOldPostTax = true;
                            }
                            if (element.oldPreTax) {
                                this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
                                this.hasOldPreTax = true;
                            }
                            element.oldPostTax = parseFloat(element?.oldPostTax?.toFixed(2));
                            element.oldPreTax = parseFloat(element?.oldPreTax?.toFixed(2));
                            element.newPostTax = parseFloat(element?.newPostTax?.toFixed(2));
                            element.newPreTax = parseFloat(element?.newPreTax?.toFixed(2));
                            policyData.push(element);
                        }
                    });
                    let employeeLife = [];
                    employeeLife = ELEMENT_DATA.filter((x) => x.policyName === "Life" && x.subPolicyName === "Employee");
                    let dependentLife = [];
                    dependentLife = ELEMENT_DATA.filter((x) => x.policyName === "Life" && x.subPolicyName === "Dependent");
                    if (employeeLife.length || dependentLife.length) {
                        const policy = {} as PdaPolicyInfo;
                        policy.policyName = "Life";
                        policyData.push(policy);
                        if (employeeLife.length) {
                            const employeeLifePolicy = {} as PdaPolicyInfo;
                            employeeLifePolicy.policyName = "Life";
                            employeeLifePolicy.subPolicyName = "Employee";
                            employeeLife.forEach((element) => {
                                if (element.newPreTax) {
                                    if (employeeLifePolicy.newPreTax === null || employeeLifePolicy.newPreTax === undefined) {
                                        employeeLifePolicy.newPreTax = 0;
                                    }
                                    employeeLifePolicy.newPreTax = employeeLifePolicy.newPreTax + element.newPreTax;
                                    this.totalNewPreCost = this.totalNewPreCost + element.newPreTax;
                                    this.hasNewPreTax = true;
                                }
                                if (element.newPostTax) {
                                    if (employeeLifePolicy.newPostTax === null || employeeLifePolicy.newPostTax === undefined) {
                                        employeeLifePolicy.newPostTax = 0;
                                    }
                                    employeeLifePolicy.newPostTax = employeeLifePolicy.newPostTax + element.newPostTax;
                                    this.totalNewPostCost = this.totalNewPostCost + element.newPostTax;
                                    this.hasNewPostTax = true;
                                }
                                if (element.oldPostTax) {
                                    if (employeeLifePolicy.oldPostTax === null || employeeLifePolicy.oldPostTax === undefined) {
                                        employeeLifePolicy.oldPostTax = 0;
                                    }
                                    employeeLifePolicy.oldPostTax = employeeLifePolicy.oldPostTax + element.oldPostTax;
                                    this.totalOldPostCost = this.totalOldPostCost + element.oldPostTax;
                                    this.hasOldPostTax = true;
                                }
                                if (element.oldPreTax) {
                                    if (employeeLifePolicy.oldPreTax === null || employeeLifePolicy.oldPreTax === undefined) {
                                        employeeLifePolicy.oldPreTax = 0;
                                    }
                                    employeeLifePolicy.oldPreTax = employeeLifePolicy.oldPreTax + element.oldPreTax;
                                    this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
                                    this.hasOldPreTax = true;
                                }
                            });
                            if (employeeLifePolicy.newPreTax !== null && employeeLifePolicy.newPreTax !== undefined) {
                                employeeLifePolicy.newPreTax = parseFloat(employeeLifePolicy.newPreTax.toFixed(2));
                            }
                            if (employeeLifePolicy.newPostTax !== null && employeeLifePolicy.newPostTax !== undefined) {
                                employeeLifePolicy.newPostTax = parseFloat(employeeLifePolicy.newPostTax.toFixed(2));
                            }
                            if (employeeLifePolicy.oldPreTax !== null && employeeLifePolicy.oldPreTax !== undefined) {
                                employeeLifePolicy.oldPreTax = parseFloat(employeeLifePolicy.oldPreTax.toFixed(2));
                            }
                            if (employeeLifePolicy.oldPostTax !== null && employeeLifePolicy.oldPostTax !== undefined) {
                                employeeLifePolicy.oldPostTax = parseFloat(employeeLifePolicy.oldPostTax.toFixed(2));
                            }
                            policyData.push(employeeLifePolicy);
                        }
                        if (dependentLife.length) {
                            const dependentLifePolicy = {} as PdaPolicyInfo;
                            dependentLifePolicy.policyName = "Life";
                            dependentLifePolicy.subPolicyName = "Dependent";
                            dependentLife.forEach((element) => {
                                if (element.newPreTax) {
                                    if (dependentLifePolicy.newPreTax === null || dependentLifePolicy.newPreTax === undefined) {
                                        dependentLifePolicy.newPreTax = 0;
                                    }
                                    dependentLifePolicy.newPreTax = dependentLifePolicy.newPreTax + element.newPreTax;
                                    this.totalNewPreCost = this.totalNewPreCost + element.newPreTax;
                                    this.hasNewPreTax = true;
                                }
                                if (element.newPostTax) {
                                    if (dependentLifePolicy.newPostTax === null || dependentLifePolicy.newPostTax === undefined) {
                                        dependentLifePolicy.newPostTax = 0;
                                    }
                                    dependentLifePolicy.newPostTax = dependentLifePolicy.newPostTax + element.newPostTax;
                                    this.totalNewPostCost = this.totalNewPostCost + element.newPostTax;
                                    this.hasNewPostTax = true;
                                }
                                if (element.oldPostTax) {
                                    if (dependentLifePolicy.oldPostTax === null || dependentLifePolicy.oldPostTax === undefined) {
                                        dependentLifePolicy.oldPostTax = 0;
                                    }
                                    dependentLifePolicy.oldPostTax = dependentLifePolicy.oldPostTax + element.oldPostTax;
                                    this.totalOldPostCost = this.totalOldPostCost + element.oldPostTax;
                                    this.hasOldPostTax = true;
                                }
                                if (element.oldPreTax) {
                                    if (dependentLifePolicy.oldPreTax === null || dependentLifePolicy.oldPreTax === undefined) {
                                        dependentLifePolicy.oldPreTax = 0;
                                    }
                                    dependentLifePolicy.oldPreTax = dependentLifePolicy.oldPreTax + element.oldPreTax;
                                    this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
                                    this.hasOldPreTax = true;
                                }
                            });
                            if (dependentLifePolicy.newPreTax !== null && dependentLifePolicy.newPreTax !== undefined) {
                                dependentLifePolicy.newPreTax = parseFloat(dependentLifePolicy.newPreTax.toFixed(2));
                            }
                            if (dependentLifePolicy.newPostTax !== null && dependentLifePolicy.newPostTax !== undefined) {
                                dependentLifePolicy.newPostTax = parseFloat(dependentLifePolicy.newPostTax.toFixed(2));
                            }
                            if (dependentLifePolicy.oldPreTax !== null && dependentLifePolicy.oldPreTax !== undefined) {
                                dependentLifePolicy.oldPreTax = parseFloat(dependentLifePolicy.oldPreTax.toFixed(2));
                            }
                            if (dependentLifePolicy.oldPostTax !== null && dependentLifePolicy.oldPostTax !== undefined) {
                                dependentLifePolicy.oldPostTax = parseFloat(dependentLifePolicy.oldPostTax.toFixed(2));
                            }
                            policyData.push(dependentLifePolicy);
                        }
                    }
                }
            }
            this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(2));
            this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(2));
            this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(2));
            this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(2));
            this.dataSource.data = policyData;
            if (this.dataSource.data.length && this.enrollmentMethod !== this.enrollmentMethodEnum.HEADSET) {
                this.isSignatureEnabled = true;
                if (this.data.isOwnAccount) {
                    this.pdaForm.get(SIGNATURE).enable();
                    if (this.showPin) {
                        this.pdaForm.get(PIN).enable();
                    }
                }
            }
            this.checkAflacCondition();
        }
    }
    /**
     *@description when user clicks on submit button payload for api call is prepared then service call invoked with appropriate payload.
     */
    onSubmit(): void {
        this.isSubmitted = true;
        if (this.showPin) {
            this.pdaForm.get(SIGNATURE).disable();
            this.pdaForm.get(SIGNATURE_2).disable();
        }
        if (!this.checkForErrorField() && this.pdaForm.valid) {
            this.pdaFormValues.enrollmentState = this.enrollmentObj?.enrollmentStateAbbreviation;
            this.loadSpinner = true;
            this.setDataValue();
            // Checks if modal has data
            // If US selected - memberState to be passed as enrollmentState part of payload to createMemberFormByType
            // If Puerto rico selected - PR to be passed as part of payload to createMemberFormByType
            if (this.data?.enrollmentType) {
                this.pdaFormValues.submissionMethod = this.data.enrollmentType;
                if (this.data?.state === "US") {
                    this.pdaFormValues.enrollmentState = this.pdaFormData?.memberAddress?.state;
                } else if (this.data?.state) {
                    this.pdaFormValues.enrollmentState = this.data.state;
                } else if (!this.data?.state && this.enrollmentObj?.enrollmentStateAbbreviation) {
                    this.pdaFormValues.enrollmentState = this.enrollmentObj.enrollmentStateAbbreviation;
                } else if (this.data.enrollmentType === this.enrollmentMethodEnum.HEADSET) {
                    this.pdaFormValues.enrollmentState = this.enrollmentObj.headSetStateAbbreviation;
                }
            } else if (this.enrollmentObj) {
                // When enrollment exists and this.data as part of modal is undefined the enrollmentState,
                // to be passed should be referred from EnrollmentMethodState.currentEnrollment.
                this.pdaFormValues.enrollmentState = this.enrollmentObj.enrollmentStateAbbreviation;
                this.pdaFormValues.submissionMethod = this.enrollmentObj.enrollmentMethod || this.enrollmentMethodEnum.FACE_TO_FACE;
            } else {
                this.pdaFormValues.submissionMethod = this.enrollmentMethodEnum.FACE_TO_FACE;
            }
            if (this.data.isEditPda && this.data.formId) {
                this.memberService
                    .updateMemberForm(this.mpGroup.toString(), this.memberId, FormType.PDA, this.data.formId, this.pdaFormValues)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((resp) => {
                        this.loadSpinner = false;
                        this.utilService.updateFormSubmission(FormType.PDA, true);
                        this.dialogRef.close(true);
                    });
            } else if (this.pdaFormValues.policyPremiums.length || this.data.isDocument) {
                this.memberService
                    .createMemberFormByType(this.memberId, this.pdaFormValues, FormType.PDA, this.mpGroup.toString())
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (res) => {
                            this.loadSpinner = false;
                            const respHeaderLocation = res.headers.get("location");
                            const eleArray = respHeaderLocation.split("/");
                            // eslint-disable-next-line radix
                            const pdaId = parseInt(eleArray[eleArray.length - 1]);
                            this.createMemberNote(pdaId);
                            this.utilService.updateFormSubmission(FormType.PDA, true);
                        },
                        (err) => {
                            this.loadSpinner = false;
                        },
                    );
            }
        }
    }

    createMemberNote(pdaId: any): void {
        const payload = {
            formInfo: {
                id: pdaId,
                type: FormType.PDA,
            },
        };
        this.memberService
            .createMemberNote(this.memberId, this.mpGroup.toString(), payload)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.dialogRef.close(true);
                    this.loadSpinner = false;
                },
                (err) => {
                    this.loadSpinner = false;
                },
            );
    }
    /**
     * @description: Function to set payload for PDA form
     */
    setDataValue(): void {
        this.pdaFormValues.isAflacPolicyHolder = null;
        this.pdaFormValues.departmentNumber = !(
            this.pdaForm.get("departmentNumber").value === null || this.pdaForm.get("departmentNumber").value === undefined
        )
            ? this.pdaForm.get("departmentNumber").value
            : null;
        this.pdaFormValues.location = !(this.pdaForm.get("location").value === null || this.pdaForm.get("location").value === undefined)
            ? this.pdaForm.get("location").value
            : null;
        this.pdaFormValues.firstDeductionDate = !(
            this.pdaForm.get("firstDeductionDate").value === null || this.pdaForm.get("firstDeductionDate").value === undefined
        )
            ? this.datePipe.transform(this.pdaForm.get("firstDeductionDate").value, AppSettings.DATE_FORMAT_YYYY_MM_DD)
            : null;
        if (this.showPin) {
            this.pdaFormValues.pin = this.pdaForm.get(PIN).value;
        } else {
            const signature = this.pdaForm.get(SIGNATURE).value ? this.pdaForm.get(SIGNATURE).value : this.pdaForm.get(SIGNATURE_2).value;
            this.pdaFormValues.signature = this.enrollmentMethod === EnrollmentMethod.HEADSET ? this.customerHeadsetSignature : signature;
        }
        this.pdaFormValues.payrollAccountNumber = !(
            this.pdaForm.get("employerPayrollAccountNumber").value === null ||
            this.pdaForm.get("employerPayrollAccountNumber").value === undefined
        )
            ? this.pdaForm.get("employerPayrollAccountNumber").value
            : null;

        this.pdaFormValues.policyPremiums = [] as PdaPolicyInfo[];
        this.pdaFormValues.policyPremiums = this.dataSource.data.filter((x) => x.policyName !== "Life");
        const lifePolicyData = [...this.pdaFormData?.policyPremiums.filter(({ policyName }) => policyName === "Life")];
        if (lifePolicyData.length) {
            this.pdaFormValues.policyPremiums = this.pdaFormValues.policyPremiums.concat(lifePolicyData);
        }

        this.dataSource2.data.forEach((res) => {
            const policy = {} as any;
            policy.policyName = res.policyName;
            policy.newPostTax = !(res.newPostTax === null || res.newPostTax === undefined) ? res.newPostTax : null;
            policy.newPreTax = !(res.newPreTax === null || res.newPreTax === undefined) ? res.newPreTax : null;
            policy.oldPreTax = !(res.oldPreTax === null || res.oldPreTax === undefined) ? res.oldPreTax : null;
            policy.oldPostTax = !(res.oldPostTax === null || res.oldPostTax === undefined) ? res.oldPostTax : null;
            this.pdaFormValues.policyPremiums.push(policy);
        });
        const policyHolder = this.pdaForm.get(AFLAC_POLICY).value;
        if (policyHolder.length) {
            this.pdaFormValues.isAflacPolicyHolder = policyHolder === "true";
        }
    }
    getAllowedPdaPolicyNames(): void {
        this.aflacService
            .getAllowedPdaPolicyNames()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.allowedPdaPolicyNames.push("Select");
                let count = 1;
                resp.forEach((element) => {
                    this.allowedPdaPolicyNames[count] = element;
                    count++;
                });
            });
    }

    // eslint-disable-next-line complexity
    onPolicySelection(policy: any): void {
        const planLength = this.dataSource2.data.length;
        this.checkForErrorField();
        if (planLength > 0 && this.dataSource2.data[planLength - 1].oneFieldReqError !== true) {
            if (policy !== "Select" && !(policy === null || policy === undefined)) {
                this.setPolicyDataSource(policy);
            }
        } else if (planLength === 0 && policy !== "Select" && !(policy === null || policy === undefined)) {
            this.setPolicyDataSource(policy);
        }
    }
    /**
     * set policy data
     * @param policy selected policy details
     */
    // eslint-disable-next-line complexity
    setPolicyDataSource(policy: any): void {
        if (policy === "Life") {
            this.dataSource2.data.push({
                policyName: policy,
            });
            this.dataSource2.data.push({
                policyName: policy,
                subPolicyName: "Employee",
            });
            this.dataSource2.data.push({
                policyName: policy,
                subPolicyName: "Dependent",
            });
        } else {
            this.dataSource2.data.push({
                policyName: policy,
            });
        }
        this.dataSource2 = new MatTableDataSource(this.dataSource2.data);
        if (this.dataSource2.data.length) {
            this.pdaForm.get(AFLAC_POLICY).disable();
        }
        if (this.enrollmentMethod !== EnrollmentMethod.HEADSET) {
            this.isSignatureEnabled = true;
            if (this.data.isOwnAccount) {
                this.pdaForm.get(SIGNATURE).enable();
                if (this.showPin) {
                    this.pdaForm.get(PIN).enable();
                }
            }
        }
        this.pdaForm.controls["pdaPolicy"].setValue("Select");
        // disable or enable the first PDA signature field based on the plans selection from dropdown on PDA page
        if ((!this.hasNewPostTax || !this.hasNewPreTax) && (!this.hasOldPostTax || !this.hasOldPreTax)) {
            this.pdaForm.get(SIGNATURE).disable();
            this.isSignatureEnabled = false;
            this.pdaForm.controls[AFLAC_POLICY].setValue("false");
        }
        if ((this.hasNewPostTax || this.hasNewPreTax) && (!this.hasOldPostTax || !this.hasOldPreTax)) {
            this.pdaForm.get(SIGNATURE).enable();
            this.pdaForm.controls[AFLAC_POLICY].setValue("");
            this.isSignatureEnabled = true;
        }
        if ((!this.hasNewPostTax || !this.hasNewPreTax) && (this.hasOldPreTax || this.hasOldPostTax)) {
            this.pdaForm.get(SIGNATURE).disable();
            this.pdaForm.controls[AFLAC_POLICY].setValue("true");
            this.isSignatureEnabled = true;
        }
        if ((this.hasNewPostTax || this.hasNewPreTax) && (this.hasOldPostTax || this.hasOldPreTax)) {
            this.pdaForm.get(SIGNATURE).enable();
            this.pdaForm.controls[AFLAC_POLICY].setValue("");
            this.isSignatureEnabled = true;
        }
    }
    onNewPreTaxChange(): void {
        this.totalNewPreCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.newPreTax === null || ele.newPreTax === undefined ? 0 : ele.newPreTax;
                this.totalNewPreCost = this.totalNewPreCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.newPreTax === null || ele.newPreTax === undefined ? 0 : ele.newPreTax;
            this.totalNewPreCost = this.totalNewPreCost + value;
        });
        this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(2));
    }
    onNewPostTaxChange(): void {
        this.totalNewPostCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.newPostTax === null || ele.newPostTax === undefined ? 0 : ele.newPostTax;
                this.totalNewPostCost = this.totalNewPostCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.newPostTax === null || ele.newPostTax === undefined ? 0 : ele.newPostTax;
            this.totalNewPostCost = this.totalNewPostCost + value;
        });
        this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(2));
    }
    onOldPreTaxChange(): void {
        this.totalOldPreCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.oldPreTax === null || ele.oldPreTax === undefined ? 0 : ele.oldPreTax;
                this.totalOldPreCost = this.totalOldPreCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.oldPreTax === null || ele.oldPreTax === undefined ? 0 : ele.oldPreTax;
            this.totalOldPreCost = this.totalOldPreCost + value;
        });
        this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(2));
    }

    onOldPostTaxChange(): void {
        this.totalOldPostCost = 0;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((ele) => {
                const value = ele.oldPostTax === null || ele.oldPostTax === undefined ? 0 : ele.oldPostTax;
                this.totalOldPostCost = this.totalOldPostCost + value;
            });
        }
        this.dataSource2.data.forEach((ele) => {
            const value = ele.oldPostTax === null || ele.oldPostTax === undefined ? 0 : ele.oldPostTax;
            this.totalOldPostCost = this.totalOldPostCost + value;
        });
        this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(2));
    }
    /**
     * checks validation of form fields
     * @returns error flag
     */
    checkForErrorField(): boolean {
        const planLength = this.dataSource.data.length;
        const planLength1 = this.dataSource2.data.length;
        const pdaPolicyFormControl = this.pdaForm.get("pdaPolicy");
        if (planLength > 0 || planLength1 > 0) {
            this.errorFieldFlag = false;
            pdaPolicyFormControl.setErrors(null);
            this.checkPlanAndPDA(planLength1, pdaPolicyFormControl);
        } else if (this.data.isDocument) {
            this.errorFieldFlag = false;
            pdaPolicyFormControl.setErrors(null);
        } else {
            this.errorFieldFlag = true;
            pdaPolicyFormControl.setErrors({ required: true });
        }
        return this.errorFieldFlag;
    }

    /**
     * Method to set pda policy based on user selection
     * @param planLength1 - check is any plan exist
     * @param pdaPolicyFormControl pda policy form control
     */
    // eslint-disable-next-line complexity
    checkPlanAndPDA(planLength1: number, pdaPolicyFormControl: AbstractControl): void {
        const employeePolicyIndex = 2;
        const selectLiteral = this.languageStrings["primary.portal.common.select"];
        const plan = this.dataSource2.data[planLength1 - 1];
        const lifePlan = this.dataSource2.data[planLength1 - employeePolicyIndex];
        const additionalLifePlan =
            plan && plan.policyName === LIFE && lifePlan.subPolicyName === EMPLOYEE
                ? plan
                : this.dataSource2.data[planLength1 - DEPENDENT_POLICY_INDEX];
        if (
            plan &&
            plan.policyName === LIFE &&
            (lifePlan.newPostTax === null || lifePlan.newPostTax === undefined) &&
            (lifePlan.oldPostTax === null || lifePlan.oldPostTax === undefined) &&
            (lifePlan.newPreTax === null || lifePlan.newPreTax === undefined) &&
            (lifePlan.oldPreTax === null || lifePlan.oldPreTax === undefined) &&
            (additionalLifePlan.newPostTax === null || additionalLifePlan.newPostTax === undefined) &&
            (additionalLifePlan.oldPostTax === null || additionalLifePlan.oldPostTax === undefined) &&
            (additionalLifePlan.newPreTax === null || additionalLifePlan.newPreTax === undefined) &&
            (additionalLifePlan.oldPreTax === null || additionalLifePlan.oldPreTax === undefined)
        ) {
            lifePlan.oneFieldReqError = true;
            additionalLifePlan.oneFieldReqError = true;
            this.errorFieldFlag = true;
            pdaPolicyFormControl.setValue(selectLiteral);
        }
        if (
            plan &&
            plan.policyName !== LIFE &&
            (plan.newPostTax === null || plan.newPostTax === undefined) &&
            (plan.oldPostTax === null || plan.oldPostTax === undefined) &&
            (plan.newPreTax === null || plan.newPreTax === undefined) &&
            (plan.oldPreTax === null || plan.oldPreTax === undefined)
        ) {
            plan.oneFieldReqError = true;
            this.errorFieldFlag = true;
            pdaPolicyFormControl.setValue(selectLiteral);
        }
    }
    checkForAflac(): void {
        this.hasNewPreTax = false;
        this.hasNewPostTax = false;
        this.hasOldPostTax = false;
        this.hasOldPreTax = false;
        if (this.dataSource.data.length) {
            this.dataSource.data.forEach((element) => {
                this.checkTaxValues(element);
            });
        }
        this.dataSource2.data.forEach((element) => {
            this.checkTaxValues(element);
        });
        this.checkAflacCondition();
    }

    checkTaxValues(element: any): void {
        if (!(element.newPreTax === null || element.newPreTax === undefined)) {
            this.hasNewPreTax = true;
        }
        if (!(element.newPostTax === null || element.newPostTax === undefined)) {
            this.hasNewPostTax = true;
        }
        if (!(element.oldPostTax === null || element.oldPostTax === undefined)) {
            this.hasOldPostTax = true;
        }
        if (!(element.oldPreTax === null || element.oldPreTax === undefined)) {
            this.hasOldPreTax = true;
        }
    }
    /**
     * check if policy is aflac
     */
    checkAflacCondition(): void {
        this.pdaForm.controls[AFLAC_POLICY].disable();
        if (this.enrollmentMethod !== EnrollmentMethod.HEADSET) {
            this.isSignature2Enabled = true;
            if (this.data.isOwnAccount) {
                this.pdaForm.get(SIGNATURE_2).enable();
                if (this.showPin) {
                    this.pdaForm.get(PIN_2).enable();
                }
            }
        }
        // eslint-disable-next-line sonarjs/no-collapsible-if
        // enable or disable the first PDA signature field based on old or new premium values selection on PDA page
        if (this.hasOldPostTax || this.hasOldPreTax) {
            if (!this.hasNewPreTax && !this.hasNewPostTax) {
                this.pdaForm.get(SIGNATURE).disable();
                this.isSignatureEnabled = false;
                this.pdaForm.controls[AFLAC_POLICY].setValue("true");
            } else {
                this.pdaForm.get(SIGNATURE).enable();
                this.isSignatureEnabled = true;
                this.pdaForm.controls[AFLAC_POLICY].setValue("");
                this.pdaForm.get(SIGNATURE_2).disable();
                if (this.showPin) {
                    this.pdaForm.get(PIN_2).disable();
                }
                this.isSignature2Enabled = false;
            }
        } else {
            // eslint-disable-next-line sonarjs/no-collapsible-if
            if (!this.hasNewPreTax && !this.hasNewPostTax) {
                this.pdaForm.get(SIGNATURE).disable();
                this.isSignatureEnabled = false;
                this.pdaForm.controls[AFLAC_POLICY].setValue("false");
            } else {
                this.pdaForm.controls[AFLAC_POLICY].setValue("");
                this.pdaForm.get(SIGNATURE).enable();
                this.isSignatureEnabled = true;
                this.pdaForm.get(SIGNATURE_2).disable();
                if (this.showPin) {
                    this.pdaForm.get(PIN_2).disable();
                }
                this.isSignature2Enabled = false;
            }
        }

        if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
            this.pdaForm.controls.signature2.disable();
            this.isSignature2Enabled = false;
            this.isSignatureEnabled = false;
            this.pdaForm.controls.signature.disable();
        }
    }
    /**
     * Method to remove policy
     * @param index row number of policy table
     * @param data is policy data
     */
    removePolicy(index: any, data: any): void {
        this.dataCopy = Object.assign(this.dataSource2.data);
        if (data.policyName === "Life") {
            const lifeArray = [];
            const lifePolicyArray = this.dataCopy.filter((x) => x.policyName === "Life");
            this.dataCopy.forEach((element) => {
                if (element.policyName === "Life") {
                    const indexData = this.dataCopy.indexOf(element);
                    lifeArray.push(indexData);
                }
            });

            for (let i = lifeArray.length - 1; i >= 0; i--) {
                this.dataCopy.splice(lifeArray[i], 1);
            }

            this.dataSource2 = new MatTableDataSource(this.dataCopy);
            for (const policy of lifePolicyArray) {
                this.calculateTotalTax(policy);
            }
        } else {
            this.dataCopy.splice(index, 1);
            this.dataSource2 = new MatTableDataSource(this.dataCopy);
            this.calculateTotalTax(data);
        }
        this.checkForAflac();
        if (!this.dataSource2.data.length && !this.dataSource.data.length && this.data.isDocument) {
            this.pdaForm.get(SIGNATURE).disable();
            if (this.showPin) {
                this.pdaForm.get(PIN).enable();
            }
            this.isSignatureEnabled = false;
        }
    }

    calculateTotalTax(data: any): void {
        this.totalNewPreCost = !(data.newPreTax === null || data.newPreTax === undefined)
            ? this.totalNewPreCost - data.newPreTax
            : this.totalNewPreCost;
        this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(2));
        this.totalNewPostCost = !(data.newPostTax === null || data.newPostTax === undefined)
            ? this.totalNewPostCost - data.newPostTax
            : this.totalNewPostCost;
        this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(2));
        this.totalOldPreCost = !(data.oldPreTax === null || data.oldPreTax === undefined)
            ? this.totalOldPreCost - data.oldPreTax
            : this.totalOldPreCost;
        this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(2));
        this.totalOldPostCost = !(data.oldPostTax === null || data.oldPostTax === undefined)
            ? this.totalOldPostCost - data.oldPostTax
            : this.totalOldPostCost;
        this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(2));
    }
    /**
     * This method updates the selected policy tax status error
     * @param selectedSubPolicyName sub policy name
     */
    updateErrorField(): void {
        this.checkForAflac();
        const planLength = this.dataSource2.data.length;
        if (planLength > 0) {
            const plan = this.dataSource2.data[planLength - 1];
            if (plan.policyName === LIFE) {
                const lifePlan = this.dataSource2.data[planLength - 2];
                const additionalLifePlan =
                    lifePlan.subPolicyName === EMPLOYEE ? plan : this.dataSource2.data[planLength - DEPENDENT_POLICY_INDEX];
                if (
                    ![
                        lifePlan.newPostTax,
                        lifePlan.oldPostTax,
                        lifePlan.newPreTax,
                        lifePlan.oldPreTax,
                        additionalLifePlan.newPostTax,
                        additionalLifePlan.oldPostTax,
                        additionalLifePlan.newPreTax,
                        additionalLifePlan.oldPreTax,
                    ].every((tax) => tax == null)
                ) {
                    lifePlan.oneFieldReqError = false;
                    additionalLifePlan.oneFieldReqError = false;
                } else {
                    this.updateErrorFieldSelectedPlan(plan, planLength);
                }
            } else {
                this.updateErrorFieldSelectedPlan(plan, planLength);
            }
        }
    }
    /**
     * This method updates the selected policy tax status error when there is no sub policy
     * @param plan selected plan deetails
     * @param planLength plans length
     */
    updateErrorFieldSelectedPlan(plan: PdaPolicyInfo, planLength: number): void {
        if (
            !(plan.newPostTax === null || plan.newPostTax === undefined) ||
            !(plan.oldPostTax === null || plan.oldPostTax === undefined) ||
            !(plan.newPreTax === null || plan.newPreTax === undefined) ||
            !(plan.oldPreTax === null || plan.oldPreTax === undefined)
        ) {
            this.dataSource2.data[planLength - 1].oneFieldReqError = false;
        }
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    /**
     * Method to close pda form
     */
    closePdaForm(): void {
        this.dialogRef.close(false);
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
