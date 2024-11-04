import { Component, OnInit, OnDestroy, ViewChild, HostBinding } from "@angular/core";
import { MatTableDataSource, MatTable } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Observable, Subscription } from "rxjs";
import { FormBuilder, Validators, FormGroup, FormControl } from "@angular/forms";
import { MemberService, AccountService, AflacService, PdaForm, FormType, PdaPolicyPremium, StaticService } from "@empowered/api";
import { Router, ActivatedRoute } from "@angular/router";

import { Store, Select } from "@ngxs/store";
import { TPIState, EnrollmentMethodState, EnrollmentMethodModel, RegexDataType, SharedState, UtilService } from "@empowered/ngxs-store";
import { tap, switchMap, filter } from "rxjs/operators";
import { SafeHtml } from "@angular/platform-browser";
import { ConfigName, TpiSSOModel, PdaData, CompanyCode, AppSettings, AccountProducer, EnrollmentMethod } from "@empowered/constants";

interface PdaPolicy {
    policyName: string;
    subPolicyName?: string;
    oldPreTax?: number;
    oldPostTax?: number;
    newPreTax?: number;
    newPostTax?: number;
    oneFieldReqError?: boolean;
}

let ELEMENT_DATA: PdaPolicy[];
const TRUE = "true";
const PIN = "pin";
const PIN_2 = "pin2";
const EMPLOYEE_POLICY = 3;

@Component({
    selector: "empowered-tpi-pda-form",
    templateUrl: "./tpi-pda-form.component.html",
    styleUrls: ["./tpi-pda-form.component.scss"],
})
export class TpiPdaFormComponent implements OnInit, OnDestroy {
    pdaFormData: PdaForm;
    producer: number;
    pdaFormValues: PdaForm = {} as PdaForm;
    pdaForm: FormGroup;
    isMember = false;
    portal = "";
    loadSpinner: boolean;
    enrollmentObj: EnrollmentMethodModel;
    memberId: number;
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
    isHeadset: boolean;
    mpGroup: number;
    eSign: string;
    enrollmentMethod: string;
    enrollmentState: string;
    allowedPdaPolicyNames: string[] = [];
    minDate = new Date();
    producerName: string;
    writingNumber: string;
    telephoneNumber: string;
    payrollMode: string;
    pdaPolicy: string;
    isSubmitted = false;
    dataCopy: PdaPolicy[] = [];
    errorFieldFlag = false;
    subscriptions: Subscription[] = [];
    primaryProducer: AccountProducer[];
    isModelMode: boolean;
    readonly APP_FLOW = "appFlow";
    @HostBinding("class") classes = "tpi-content-wrapper";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pda.form.pdaTitle",
        "primary.portal.pda.form.paymentInfo",
        "primary.portal.pda.form.departmentNum",
        "primary.portal.common.optional",
        "primary.portal.pda.form.location",
        "primary.portal.pda.form.deductionDate",
        "primary.portal.common.dateHint",
        "primary.portal.common.requiredField",
        "primary.portal.pda.form.payrollMode",
        "primary.portal.common.select",
        "primary.portal.pda.form.policyName",
        "primary.portal.pda.form.policyOld",
        "primary.portal.pda.form.policyNew",
        "primary.portal.pda.form.pretax",
        "primary.portal.setPrices.dollar",
        "primary.portal.pda.form.afterTax",
        "primary.portal.pda.form.atLeastOneField",
        "primary.portal.common.remove",
        "primary.portal.common.total",
        "primary.portal.pda.form.deductionFrequencyPara",
        "primary.portal.pda.form.employeeInfo",
        "primary.portal.pda.form.firstName",
        "primary.portal.pda.form.middleName",
        "primary.portal.pda.form.lastName",
        "primary.portal.pda.form.atLeastOnePolicy",
        "primary.portal.pda.form.employeeSSN",
        "primary.portal.pda.form.employerName",
        "primary.portal.pda.form.employerAccount",
        "primary.portal.pda.form.herebyAuthorizeText",
        "primary.portal.pda.form.additionUnderstandText",
        "primary.portal.pda.form.employeeSign",
        "primary.portal.pda.form.signRequired",
        "primary.portal.pda.form.customerSignLater",
        "primary.portal.pda.form.waiverPart",
        "primary.portal.pda.form.certifyFeaturesText",
        "primary.portal.pda.form.understandPoliciesText",
        "primary.portal.pda.form.notAflacRadioText",
        "primary.portal.pda.form.aflacRadioText",
        "primary.portal.pda.form.signWaiverRequired",
        "primary.portal.pda.form.producerInfo",
        "primary.portal.pda.form.producerName",
        "primary.portal.pda.form.date",
        "primary.portal.pda.form.writingNumber",
        "primary.portal.pda.form.telephoneNumber",
        "primary.portal.common.back",
        "primary.portal.common.save",
        "primary.portal.pda.form.enterPin",
    ]);

    displayedColumns: string[] = ["policyName", "oldPreTax", "oldPostTax", "newPreTax", "newPostTax", "removeRow"];
    dataSource: MatTableDataSource<PdaPolicy>;
    dataSource2: MatTableDataSource<PdaPolicy>;
    manualAddData: PdaPolicy[] = [];
    @ViewChild(MatTable) policyTable: MatTable<PdaPolicy>;
    LIFE = "Life";
    EMPLOYEE = "Employee";
    DEPENDENT = "Dependent";
    DECIMAL_PLACES = 2;
    NEW = "NEW";
    SSN_FORMAT = "000-00-0000";
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    SELECT = "Select";
    LOCATION = "location";
    producerId: number;
    showPRStateForm = false;
    data: PdaData;
    showPin = false;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    validationRegex: RegexDataType;
    isCallCenter = false;
    customerHeadsetSignature = "";
    constructor(
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly memberService: MemberService,
        private readonly utilService: UtilService,
        private readonly accountService: AccountService,
        private readonly aflacService: AflacService,
        private readonly staticService: StaticService,
    ) {
        this.isHeadset = false;
    }
    /**
     * lifecycle method for component initialization
     */
    ngOnInit(): void {
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        this.subscriptions.push(
            this.route.queryParams.subscribe((params) => {
                this.showPRStateForm = params[CompanyCode.PR] === TRUE;
                this.enrollmentMethod = params["enrollmentMethod"];
            }),
        );
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (this.enrollmentObj) {
            this.enrollmentMethod = this.enrollmentObj.enrollmentMethod ?? "";
        }
        this.isHeadset = this.enrollmentMethod === EnrollmentMethod.HEADSET;
        const tpiSsoDetail: TpiSSOModel = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.isModelMode = tpiSsoDetail.modal;
        this.producer = tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId);
        this.mpGroup = this.store.selectSnapshot(TPIState).tpiSSODetail.user.groupId.toString();
        this.memberId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.memberId;

        this.subscriptions.push(
            this.regex$
                .pipe(
                    filter((regexResponse: RegexDataType) => regexResponse !== undefined),
                    tap((regexResponse: RegexDataType) => {
                        this.validationRegex = regexResponse;
                    }),
                )
                .subscribe(),
        );
        this.setHeadsetSignatureConfig();
        if (this.showPRStateForm) {
            this.data = {
                mpGroupId: this.mpGroup,
                memberId: this.memberId.toString(),
                producerId: tpiSsoDetail.user.producerId,
                isDocument: false,
                state: null,
                isOwnAccount: true,
                enrollmentType: this.enrollmentMethod,
            };
        } else {
            this.dataSource2 = new MatTableDataSource<PdaPolicy>(this.manualAddData);
            this.dataSource = new MatTableDataSource<PdaPolicy>(this.manualAddData);
            this.dataSource2.data = [];
            this.dataSource.data = [];
            if (this.producer) {
                this.getProducerDetails();
            }
            this.definePdaForm();
            this.getMemberFormData();
            this.getAllowedPdaPolicyNames();
            this.disablePdaForm();
        }
    }

    /**
     * set headset signature field value from config
     */
    setHeadsetSignatureConfig(): void {
        this.subscriptions.push(
            this.staticService
                .getConfigurations(ConfigName.TELEPHONE_SIGNATURE_PLACEHOLDER, this.mpGroup)
                .pipe(filter((configurations) => !!configurations.length))
                .subscribe((configurations) => {
                    this.customerHeadsetSignature = configurations[0].value;
                }),
        );
    }
    /**
     * Fetch logged in producer details
     */
    getProducerDetails(): void {
        this.subscriptions.push(
            this.accountService.getAccountProducer(this.producer.toString(), this.mpGroup).subscribe((producerDetail) => {
                const selectedProducer = producerDetail.producer;
                if (selectedProducer.writingNumbers && selectedProducer.writingNumbers.length) {
                    this.writingNumber = selectedProducer.writingNumbers[0].number;
                }
                if (selectedProducer.name) {
                    this.producerName = `${selectedProducer.name.firstName} ${selectedProducer.name.lastName}`;
                }
                if (selectedProducer.phoneNumber) {
                    this.telephoneNumber = selectedProducer.phoneNumber;
                }
            }),
        );
    }
    /**
     * get member form data to prepopulate form
     */
    getMemberFormData(): void {
        this.loadSpinner = true;
        this.subscriptions.push(
            this.memberService
                .getMemberFormsByType(this.memberId, FormType.PDA, this.mpGroup.toString(), this.NEW)
                .pipe(
                    tap((res) => {
                        if (res.length) {
                            this.pdaFormData = res[0];
                            this.eSign = this.pdaFormData.signature;
                            this.setFormValues(this.pdaFormData);
                        }
                    }),
                    switchMap((res) => this.accountService.getPayFrequencies(this.mpGroup.toString())),
                )
                .subscribe(
                    (payFrequency) => {
                        if (this.pdaFormData) {
                            const payFreq = payFrequency.find((x) => x.id === this.pdaFormData.payFrequencyId);
                            if (payFreq) {
                                this.payrollMode = payFreq.name;
                            }
                        }
                        this.loadSpinner = false;
                    },
                    (err) => {
                        this.loadSpinner = false;
                    },
                ),
        );
    }

    /**
     * method to disable form elements based on requirements
     */
    disablePdaForm(): void {
        this.pdaForm.get("ssn").disable();
        this.pdaForm.get("employerName").disable();
        this.pdaForm.get("employerPayrollAccountNumber").disable();
        this.pdaForm.get("firstName").disable();
        this.pdaForm.get("lastName").disable();
        this.pdaForm.get("middleName").disable();
        this.pdaForm.get("isAflac").disable();
        this.checkForHeadSetEnrollment();
    }
    /**
     * method to check enrollment method
     */
    checkForHeadSetEnrollment(): void {
        if (this.store.selectSnapshot(TPIState).tpiSSODetail.user.producerId) {
            this.producerId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.producerId;
            if (this.producerId) {
                const enrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                if (enrollment || this.enrollmentMethod === EnrollmentMethod.HEADSET) {
                    this.setHeadsetEnrollment();
                }
            }
        }
    }
    /**
     * method to modify form if enrollment method is headset
     */
    setHeadsetEnrollment(): void {
        const enrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (!this.enrollmentMethod) {
            this.enrollmentMethod = enrollment?.enrollmentMethod ?? "";
        }
        this.enrollmentState = !(enrollment?.enrollmentState === null || enrollment?.enrollmentState === undefined)
            ? enrollment.enrollmentState
            : "";
        if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
            this.isHeadset = true;
            this.pdaForm.get("eSignature").disable();
            this.pdaForm.get("eSignature2").disable();
        }
    }
    /**
     * method to declare and create form
     */
    definePdaForm(): void {
        this.pdaForm = this.fb.group({
            ssn: [],
            employerName: [],
            employerPayrollAccountNumber: [],
            firstName: [],
            lastName: [],
            middleName: [],
            eSignature: ["", Validators.required],
            departmentNumber: [],
            location: [],
            firstDeductionDate: ["", Validators.required],
            payrollAccountNumber: [],
            policyPremiums: [],
            telephoneNumber: [],
            pdaPolicy: [],
            eSignature2: ["", Validators.required],
            isAflac: [],
        });
        this.checkForPinEnrollment();
    }
    /**
     *@description will check for pin enrollment based on that add new form control for pin.
     */
    checkForPinEnrollment(): void {
        if (this.enrollmentMethod === EnrollmentMethod.CALL_CENTER || this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE) {
            this.showPin = true;
            this.isCallCenter = true;
            this.pdaForm.addControl(
                PIN,
                new FormControl(
                    {
                        value: this.data && this.data.pinDetails && this.data.pinDetails.pin ? this.data.pinDetails.pin : "",
                        disabled: false,
                    },
                    [Validators.required, Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE)],
                ),
            );
            this.pdaForm.addControl(PIN_2, new FormControl({ value: "", disabled: false }));
        }
    }
    /**
     * method to prepopulate form
     * @param: pdaFormData - data to prepopulate form
     */
    setFormValues(pdaFormData: PdaForm): void {
        let policyData = [] as PdaPolicy[];
        if (this.pdaFormData) {
            this.patchFormValues();
            if (this.pdaFormData.policyPremiums.length > 0) {
                ELEMENT_DATA = this.pdaFormData.policyPremiums.slice();
                if (this.pdaFormData) {
                    policyData = this.setPolicyCost(ELEMENT_DATA);
                    let employeeLife: PdaPolicy[] = [];
                    employeeLife = ELEMENT_DATA.filter((x) => x.policyName === this.LIFE && x.subPolicyName === this.EMPLOYEE);
                    let dependentLife: PdaPolicy[] = [];
                    dependentLife = ELEMENT_DATA.filter((x) => x.policyName === this.LIFE && x.subPolicyName === this.DEPENDENT);
                    if (employeeLife.length || dependentLife.length) {
                        const policy = {} as PdaPolicy;
                        policy.policyName = this.LIFE;
                        policyData.push(policy);
                        policyData.push(this.getCost(employeeLife));
                        if (dependentLife.length) {
                            const dependentLifePolicy = {} as PdaPolicy;
                            dependentLifePolicy.policyName = this.LIFE;
                            dependentLifePolicy.subPolicyName = this.DEPENDENT;
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
                                dependentLifePolicy.newPreTax = parseFloat(dependentLifePolicy.newPreTax.toFixed(this.DECIMAL_PLACES));
                            }
                            if (dependentLifePolicy.newPostTax !== null && dependentLifePolicy.newPostTax !== undefined) {
                                dependentLifePolicy.newPostTax = parseFloat(dependentLifePolicy.newPostTax.toFixed(this.DECIMAL_PLACES));
                            }
                            if (dependentLifePolicy.oldPreTax !== null && dependentLifePolicy.oldPreTax !== undefined) {
                                dependentLifePolicy.oldPreTax = parseFloat(dependentLifePolicy.oldPreTax.toFixed(this.DECIMAL_PLACES));
                            }
                            if (dependentLifePolicy.oldPostTax !== null && dependentLifePolicy.oldPostTax !== undefined) {
                                dependentLifePolicy.oldPostTax = parseFloat(dependentLifePolicy.oldPostTax.toFixed(this.DECIMAL_PLACES));
                            }
                            policyData.push(dependentLifePolicy);
                        }
                    }
                }
            }
            this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(this.DECIMAL_PLACES));
            this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(this.DECIMAL_PLACES));
            this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(this.DECIMAL_PLACES));
            this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(this.DECIMAL_PLACES));
            this.dataSource.data = policyData;
            if (this.dataSource.data.length === 0) {
                this.pdaForm.controls.pdaPolicy.setValidators(Validators.required);
                this.pdaForm.controls.pdaPolicy.updateValueAndValidity();
            }
            this.checkAflacCondition();
        }
    }

    /**
     * Method to set the form values
     */
    patchFormValues(): void {
        this.pdaForm.patchValue({
            firstName: this.pdaFormData.memberName.firstName,
            middleName: this.pdaFormData.memberName.middleName,
            lastName: this.pdaFormData.memberName.lastName,
            employerName: this.pdaFormData.employerName,
            ssn: this.pdaFormData.socialSecurityNumber,
            employerPayrollAccountNumber: this.pdaFormData.payrollAccountNumber,
        });
    }
    /**
     * Method sets the total Tax cost
     * @param ELEMENTS_DATA : PdaPolicy[] - current policy info
     * @return: PdaPolicy[] - policy info for a particular policy
     */
    setPolicyCost(ELEMENTS_DATA: PdaPolicy[]): PdaPolicy[] {
        const policyData = [] as PdaPolicy[];
        ELEMENTS_DATA.forEach((element) => {
            if (element.policyName !== this.LIFE) {
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
        return policyData;
    }
    /**
     * method to calculate cost for member
     * @param: employeeLife - current policy info
     * @return: PdaPolicy - cost for the member
     */
    getCost(employeeLife: PdaPolicy[]): PdaPolicy {
        const employeeLifePolicy = {} as PdaPolicy;
        if (employeeLife.length) {
            employeeLifePolicy.policyName = this.LIFE;
            employeeLifePolicy.subPolicyName = this.EMPLOYEE;
            employeeLife.forEach((element) => {
                this.empTax(element, employeeLifePolicy);
            });
            if (employeeLifePolicy.newPreTax !== null && employeeLifePolicy.newPreTax !== undefined) {
                employeeLifePolicy.newPreTax = parseFloat(employeeLifePolicy.newPreTax.toFixed(this.DECIMAL_PLACES));
            }
            if (employeeLifePolicy.newPostTax !== null && employeeLifePolicy.newPostTax !== undefined) {
                employeeLifePolicy.newPostTax = parseFloat(employeeLifePolicy.newPostTax.toFixed(this.DECIMAL_PLACES));
            }
            if (employeeLifePolicy.oldPreTax !== null && employeeLifePolicy.oldPreTax !== undefined) {
                employeeLifePolicy.oldPreTax = parseFloat(employeeLifePolicy.oldPreTax.toFixed(this.DECIMAL_PLACES));
            }
            if (employeeLifePolicy.oldPostTax !== null && employeeLifePolicy.oldPostTax !== undefined) {
                employeeLifePolicy.oldPostTax = parseFloat(employeeLifePolicy.oldPostTax.toFixed(this.DECIMAL_PLACES));
            }
        }
        return employeeLifePolicy;
    }
    /**
     * method to calculate employee tax values
     * @param: employeeLifePolicy - current policy
     * @param: element - current loop element to be checked
     */
    empTax(element: PdaPolicy, employeeLifePolicy: PdaPolicy): void {
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
            this.checkEmpOldPreTax(employeeLifePolicy, element);
        }
    }
    /**
     * method to chech old pretax of member
     * @param: employeeLifePolicy - current policy
     * @param: element - current loop element to be checked
     */
    checkEmpOldPreTax(employeeLifePolicy: PdaPolicy, element: PdaPolicy): void {
        if (employeeLifePolicy.oldPreTax === null || employeeLifePolicy.oldPreTax === undefined) {
            employeeLifePolicy.oldPreTax = 0;
        }
        employeeLifePolicy.oldPreTax = employeeLifePolicy.oldPreTax + element.oldPreTax;
        this.totalOldPreCost = this.totalOldPreCost + element.oldPreTax;
        this.hasOldPreTax = true;
    }
    /**
     * method executed on form submission
     */
    onSubmit(): void {
        const RADIX = 10;
        if (this.showPin) {
            this.pdaForm.get("eSignature").disable();
            this.pdaForm.get("eSignature2").disable();
        }
        this.isSubmitted = true;
        if (!this.checkForErrorField() && this.pdaForm.valid) {
            this.loadSpinner = true;
            this.pdaFormValues.submissionMethod = this.enrollmentMethod;
            this.setEnrollmentState();
            this.setDataValue();
            if (this.pdaFormValues.policyPremiums.length) {
                let respHeaderLocation: string;
                let eleArray: string[];
                let pdaId: number;
                const payload = {
                    formInfo: {
                        id: 0,
                        type: "",
                    },
                };
                this.subscriptions.push(
                    this.memberService
                        .createMemberFormByType(this.memberId, this.pdaFormValues, FormType.PDA, this.mpGroup.toString())
                        .pipe(
                            tap((res) => {
                                respHeaderLocation = res.headers.get(this.LOCATION);
                                eleArray = respHeaderLocation.split("/");
                                pdaId = parseInt(eleArray[eleArray.length - 1], RADIX);
                                payload.formInfo.id = pdaId;
                                payload.formInfo.type = FormType.PDA;
                            }),
                            switchMap((result) =>
                                this.memberService.createMemberNote(this.memberId.toString(), this.mpGroup.toString(), payload),
                            ),
                        )
                        .subscribe(
                            (res) => {
                                this.loadSpinner = false;
                                this.utilService.updateFormSubmission(FormType.PDA, true);
                                this.router.navigate(["../view"], {
                                    relativeTo: this.route,
                                });
                            },
                            (err) => {
                                this.loadSpinner = false;
                            },
                        ),
                );
            } else {
                this.loadSpinner = false;
            }
        }
    }

    /**
     * Sets enrollment state for TPI when accessed via PDA Forms or TPI enrollment flow
     */

    setEnrollmentState(): void {
        if (this.enrollmentObj?.enrollmentStateAbbreviation) {
            this.pdaFormValues.enrollmentState = this.enrollmentObj?.enrollmentStateAbbreviation;
        } else if (!this.showPRStateForm) {
            this.pdaFormValues.enrollmentState = this.pdaFormData?.memberAddress?.state;
        } else {
            this.pdaFormValues.enrollmentState = CompanyCode.PR;
        }
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
     * set data value for form
     */
    setDataValue(): void {
        const DEPARTMENT_NUMBER = this.pdaForm.get("departmentNumber");
        const LOCATION = this.pdaForm.get(this.LOCATION);
        const FIRST_DEDUCTION_DATE = this.pdaForm.get("firstDeductionDate");
        const EMPLOYEE_PAYROLL_ACCOUNT_NUMBER = this.pdaForm.get("employerPayrollAccountNumber");

        this.pdaFormValues.departmentNumber = !(DEPARTMENT_NUMBER.value === null || DEPARTMENT_NUMBER.value === undefined)
            ? DEPARTMENT_NUMBER.value
            : null;
        if (this.showPin) {
            this.pdaFormValues.pin = this.pdaForm.get(PIN).value;
        }
        this.pdaFormValues.location = !(LOCATION.value === null || LOCATION.value === undefined) ? LOCATION.value : null;
        this.pdaFormValues.firstDeductionDate = !(FIRST_DEDUCTION_DATE.value === null || FIRST_DEDUCTION_DATE.value === undefined)
            ? this.datePipe.transform(FIRST_DEDUCTION_DATE.value, AppSettings.DATE_FORMAT_YYYY_MM_DD)
            : null;
        this.pdaFormValues.payrollAccountNumber = !(
            EMPLOYEE_PAYROLL_ACCOUNT_NUMBER.value === null || EMPLOYEE_PAYROLL_ACCOUNT_NUMBER.value === undefined
        )
            ? EMPLOYEE_PAYROLL_ACCOUNT_NUMBER.value
            : null;

        const policyData = this.pdaFormData.policyPremiums;
        this.pdaFormValues.policyPremiums = [] as PdaPolicy[];
        this.pdaFormValues.policyPremiums = this.dataSource.data.filter((x) => x.policyName !== this.LIFE);
        let lifePolicyData: PdaPolicyPremium[] = [];
        lifePolicyData = policyData.filter((x) => x.policyName === this.LIFE);
        if (lifePolicyData.length) {
            this.pdaFormValues.policyPremiums = this.pdaFormValues.policyPremiums.concat(lifePolicyData);
        }

        this.dataSource2.data.forEach((res) => {
            if (res) {
                this.dataSourceTaxCheck(res);
            }
        });
        this.setDefaultSignatureForHeadSet();
        this.pdaFormValues.isAflacPolicyHolder = this.pdaForm.get("isAflac").value === "true" ? true : false;
    }
    /**
     * method to check null value for member tax
     * @param: res - current policy response
     */
    dataSourceTaxCheck(res: PdaPolicy): void {
        const policy = {} as PdaPolicy;
        policy.policyName = res.policyName;
        policy.newPostTax = !(res.newPostTax === null || res.newPostTax === undefined) ? res.newPostTax : null;
        policy.newPreTax = !(res.newPreTax === null || res.newPreTax === undefined) ? res.newPreTax : null;
        policy.oldPreTax = !(res.oldPreTax === null || res.oldPreTax === undefined) ? res.oldPreTax : null;
        policy.oldPostTax = !(res.oldPostTax === null || res.oldPostTax === undefined) ? res.oldPostTax : null;
        this.pdaFormValues.policyPremiums.push(policy);
    }
    /**
     * method to set default signature for headset method of enrollment
     */
    setDefaultSignatureForHeadSet(): void {
        const E_SIGNATURE = this.pdaForm.get("eSignature");
        if (!this.isHeadset && !this.isCallCenter) {
            this.pdaFormValues.signature = !(E_SIGNATURE.value === null || E_SIGNATURE.value === undefined) ? E_SIGNATURE.value : null;
        } else if (this.isHeadset) {
            this.pdaFormValues.signature = this.customerHeadsetSignature;
        }
    }
    /**
     * method to get the allowed policy names
     */
    getAllowedPdaPolicyNames(): void {
        this.subscriptions.push(
            this.aflacService.getAllowedPdaPolicyNames().subscribe((resp) => {
                this.allowedPdaPolicyNames.push(this.SELECT);
                let count = 1;
                resp.forEach((element) => {
                    this.allowedPdaPolicyNames[count] = element;
                    count++;
                });
            }),
        );
    }
    /**
     * method called on selecting a policy from dropdown
     */
    onPolicySelection(policy: string): void {
        const planLength = this.dataSource2.data.length;
        this.checkForErrorField();
        if (planLength > 0 && this.dataSource2.data[planLength - 1].oneFieldReqError !== true) {
            if (policy !== this.SELECT && !(policy === null || policy === undefined)) {
                this.setPolicyDataSource(policy);
            }
        } else if (planLength === 0 && policy !== this.SELECT && !(policy === null || policy === undefined)) {
            this.setPolicyDataSource(policy);
        }
    }
    /**
     * method to set policy value based on
     */
    setPolicyDataSource(policy: string): void {
        if (policy === this.LIFE) {
            this.dataSource2.data.push({
                policyName: policy,
            });
            this.dataSource2.data.push({
                policyName: policy,
                subPolicyName: this.EMPLOYEE,
            });
            this.dataSource2.data.push({
                policyName: policy,
                subPolicyName: this.DEPENDENT,
            });
        } else {
            this.dataSource2.data.push({
                policyName: policy,
            });
        }
        this.dataSource2 = new MatTableDataSource(this.dataSource2.data);
        this.pdaForm.controls["pdaPolicy"].setValue(this.SELECT);
    }
    /**
     * method to accommodate new pre tax change
     */

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
        this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(this.DECIMAL_PLACES));
    }
    /**
     * method to accommodate new post tax change
     */
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
        this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(this.DECIMAL_PLACES));
    }
    /**
     * method to accommodate old pre tax change
     */
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
        this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(this.DECIMAL_PLACES));
    }
    /**
     * method to accommodate old post tax change
     */
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
        this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(this.DECIMAL_PLACES));
    }
    /**
     * method to validate form values
     */
    checkForErrorField(): boolean {
        const planLength = this.dataSource2.data.length;
        this.errorFieldFlag = false;
        if (planLength > 0) {
            const plan = this.dataSource2.data[planLength - 1];
            if (plan.policyName === this.LIFE) {
                this.checkTaxError(planLength, plan);
            }
            if (
                plan.policyName !== this.LIFE &&
                (plan.newPostTax === null || plan.newPostTax === undefined) &&
                (plan.oldPostTax === null || plan.oldPostTax === undefined) &&
                (plan.newPreTax === null || plan.newPreTax === undefined) &&
                (plan.oldPreTax === null || plan.oldPreTax === undefined)
            ) {
                this.dataSource2.data[planLength - 1].oneFieldReqError = true;
                this.errorFieldFlag = true;
                this.pdaForm.controls["pdaPolicy"].setValue(this.SELECT);
            }
        }
        return this.errorFieldFlag;
    }
    /**
     * method to check tax errors in current selection
     * @param planLength - current plan selection length
     * @param plan selected plan details
     */
    checkTaxError(planLength: number, plan: PdaPolicy): void {
        const lifePlan = this.dataSource2.data[planLength - this.DECIMAL_PLACES];
        this.errorFieldFlag = false;
        const additionalLifePlan =
            lifePlan && lifePlan.subPolicyName === this.EMPLOYEE ? plan : this.dataSource2.data[planLength - EMPLOYEE_POLICY];
        if (this.checkLifePlanPolicyTaxStatus(lifePlan, additionalLifePlan)) {
            lifePlan.oneFieldReqError = true;
            additionalLifePlan.oneFieldReqError = true;
            this.errorFieldFlag = true;
            this.pdaForm.controls["pdaPolicy"].setValue(this.SELECT);
        }
    }
    /**
     *
     * @param lifePlan selected life plan policy details
     * @param additionalLifePlan additional life plan policy details
     * @returns true if no tax value exists
     */
    checkLifePlanPolicyTaxStatus(lifePlan: PdaPolicy, additionalLifePlan: PdaPolicy): boolean {
        return [
            lifePlan.newPostTax,
            lifePlan.oldPostTax,
            lifePlan.newPreTax,
            lifePlan.oldPreTax,
            additionalLifePlan.newPostTax,
            additionalLifePlan.oldPostTax,
            additionalLifePlan.newPreTax,
            additionalLifePlan.oldPreTax,
        ].every((tax) => tax == null);
    }
    /**
     * method to check aflac tax values
     */
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
    /**
     * method to check tax values entered in the form
     * @param: element - current policy information
     */
    checkTaxValues(element: PdaPolicy): void {
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
     * method to check aflac eligibility and disbale form fields
     */
    checkAflacCondition(): void {
        const IS_ALFAC = this.pdaForm.controls["isAflac"];
        const E_SIGNATURE = this.pdaForm.get("eSignature2");
        if (this.hasOldPostTax || this.hasOldPreTax) {
            if (!this.hasNewPreTax && !this.hasNewPostTax && !this.isHeadset) {
                IS_ALFAC.setValue(AppSettings.TRUE);
                E_SIGNATURE.enable();
            } else {
                IS_ALFAC.setValue("");
                E_SIGNATURE.setValue("");
                E_SIGNATURE.disable();
            }
        } else if (!(this.hasOldPostTax || this.hasOldPreTax)) {
            if (!this.hasNewPreTax && !this.hasNewPostTax && !this.isHeadset) {
                IS_ALFAC.setValue(AppSettings.FALSE);
                E_SIGNATURE.enable();
            } else {
                IS_ALFAC.setValue("");
                E_SIGNATURE.setValue("");
                E_SIGNATURE.disable();
            }
        }
    }
    /**
     * method to remove a pre-selected policy
     * @param: index - index number of policy removed
     * @param: data - current policy information
     */
    removePolicy(index: number, data: PdaPolicy): void {
        this.dataCopy = Object.assign(this.dataSource2.data);
        if (data.policyName === this.LIFE) {
            const lifeArray: number[] = [];
            const lifePolicyArray = this.dataCopy.filter((x) => x.policyName === this.LIFE);
            this.dataCopy.forEach((element) => {
                if (element.policyName === this.LIFE) {
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
    }
    /**
     * method to calculate total tax
     * @param: data - current policy information
     */
    calculateTotalTax(data: PdaPolicy): void {
        this.totalNewPreCost = !(data.newPreTax === null || data.newPreTax === undefined)
            ? this.totalNewPreCost - data.newPreTax
            : this.totalNewPreCost;
        this.totalNewPreCost = parseFloat(this.totalNewPreCost.toFixed(this.DECIMAL_PLACES));
        this.totalNewPostCost = !(data.newPostTax === null || data.newPostTax === undefined)
            ? this.totalNewPostCost - data.newPostTax
            : this.totalNewPostCost;
        this.totalNewPostCost = parseFloat(this.totalNewPostCost.toFixed(this.DECIMAL_PLACES));
        this.totalOldPreCost = !(data.oldPreTax === null || data.oldPreTax === undefined)
            ? this.totalOldPreCost - data.oldPreTax
            : this.totalOldPreCost;
        this.totalOldPreCost = parseFloat(this.totalOldPreCost.toFixed(this.DECIMAL_PLACES));
        this.totalOldPostCost = !(data.oldPostTax === null || data.oldPostTax === undefined)
            ? this.totalOldPostCost - data.oldPostTax
            : this.totalOldPostCost;
        this.totalOldPostCost = parseFloat(this.totalOldPostCost.toFixed(this.DECIMAL_PLACES));
    }
    /**
     * method to update form validation errors
     */
    updateErrorField(): void {
        this.checkForAflac();
        const planLength = this.dataSource2.data.length;
        if (planLength > 0) {
            const plan = this.dataSource2.data[planLength - 1];
            if (plan.policyName === this.LIFE) {
                this.checkPolicyError(planLength, plan);
            }

            if (
                plan.policyName !== this.LIFE &&
                (!(plan.newPostTax == null) || !(plan.oldPostTax == null) || !(plan.newPreTax == null) || !(plan.oldPreTax == null))
            ) {
                this.dataSource2.data[planLength - 1].oneFieldReqError = false;
            }
        }
    }
    /**
     * method to update error field based on policy selection
     * @param: planLength - length of current selected plan
     */
    checkPolicyError(planLength: number, plan: PdaPolicy): void {
        const lifePlan = this.dataSource2.data[planLength - this.DECIMAL_PLACES];
        const additionalLifePlan = lifePlan.subPolicyName === this.EMPLOYEE ? plan : this.dataSource2.data[planLength - EMPLOYEE_POLICY];
        if (!this.checkLifePlanPolicyTaxStatus(lifePlan, additionalLifePlan)) {
            lifePlan.oneFieldReqError = false;
            additionalLifePlan.oneFieldReqError = false;
        }
    }

    /**
     * lifecycle method on component destroy
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
