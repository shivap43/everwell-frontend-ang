import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from "@angular/core";
import { AccountService, ProducerService, BenefitsOfferingService, SitCode } from "@empowered/api";
import { FormGroup, Validators, FormBuilder, FormArray } from "@angular/forms";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Subscription } from "rxjs";
import { AflacBusinessService } from "@empowered/api-service";
import { filter, tap } from "rxjs/operators";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    RoleType,
    SITCode,
    WritingNumber,
    WritingNumberArray,
} from "@empowered/constants";
import { UtilService, StaticUtilService } from "@empowered/ngxs-store";
import { ZeroPercentCommissionComponent } from "../../components";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-add-commission-splits",
    templateUrl: "./add-commission-splits.component.html",
    styleUrls: ["./add-commission-splits.component.scss"],
})
export class AddCommissionSplitsComponent implements OnInit, OnDestroy {
    @Input() producerData: any;
    @Input() splitProducerList: any;
    @Output() goBackToStepTow: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancelSingleAdd: EventEmitter<any> = new EventEmitter<any>();
    @Input() roleList: any;
    @Input() companyCode: string;
    @Input() mpGroupId: number;

    assignmentControlList = {
        ASSIGNMENTS: "assignments",
        PRODUCER_ID: "producerId",
        WRITING_NUMBER: "writingNumber",
        PERCENTAGE: "percentage",
        SITE_CODE: "sitCode",
        SITCodeHierarchyList: "SITCodeHierarchyList",
    };
    SITCodeHierarchyList = "";
    percentageDropdown: any = [];
    CONTROLS = "controls";
    sumError: string;
    enrollMethodRulesDDData: any = [];
    carrierRulesDDData: any[];
    productRulesDDData: any[];
    producerList: any[];
    producersList: any = [];
    addUpdateCustomizedSplitForm: FormGroup;
    errorMessageArray = [];
    addProducerStep2: boolean;
    isSpinnerLoading = false;
    duplicateWritingNumber = false;
    ERROR = "error";
    DETAILS = "details";
    errorMessage: string;
    ROLE_DETAILS = "";
    languageString: Record<string, string>;
    secondaryLanguageStrings: Record<string, string>;
    setInfo = "";
    maxLength = 50;
    benefitOfferingStatesData: any[];
    STATE: "STATE";
    CARRIER = "CARRIER";
    showErrorMessage = false;
    subscriber: Subscription[] = [];
    enableSitCodeHierarchy: boolean;
    todayDate = new Date();
    activeWritingNumbers: WritingNumberArray[] = [];
    INITIAL_INDEX = 0;
    producerInvited = false;
    hideInfoIcon = true;

    constructor(
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly producerService: ProducerService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly aflacBusinessService: AflacBusinessService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {
        this.fetchLanguageValues();
        this.getPercentage();
    }

    /**
     * fetch config,set language and form data
     */
    ngOnInit(): void {
        this.subscriber.push(
            this.staticUtilService
                .cacheConfigEnabled("general.enable.sit_code.hierarchy")
                .pipe(
                    tap((enableSitCodeHierarchy) => {
                        this.enableSitCodeHierarchy = enableSitCodeHierarchy;
                    }),
                )
                .subscribe(),
        );
        this.initializeForm();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        if (!this.producerData.carriers) {
            this.getBenefitOfferingStates();
        }
        this.setLanguageStrings();
        this.retriveProducerList();
    }

    /**
     * Function to initialize form
     */
    initializeForm(): void {
        this.addUpdateCustomizedSplitForm = this.fb.group({
            assignments: this.fb.array([], Validators.maxLength(4)),
            role: [
                this.roleList.length === 1 ? this.roleList[0].id : "",
                { validators: this.producerData.isUnauthorized ? null : Validators.required, updateOn: "blur" },
            ],
            message: ["", { updateOn: "submit" }],
        });
        this.subscriber.push(
            this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS).valueChanges.subscribe((result) => {
                this.sumError = "";
            }),
        );
        if (!this.producerData.isUnauthorized) {
            this.addMultipleProducers();
            if (this.roleList.length === 1) {
                this.addUpdateCustomizedSplitForm.controls.role.disable();
            }
        }
        if (this.producerData.enrollerInvitesOnly) {
            const enrollerPos = this.roleList.find(({ name }) => name === RoleType.ENROLLER);
            this.addUpdateCustomizedSplitForm.controls["role"].setValue(enrollerPos.id);
        }
    }

    getPercentage(): void {
        for (let i = 0; i <= 100; i = i + 10) {
            this.percentageDropdown.push(i);
        }
    }

    addMultipleProducers(): void {
        const assignments = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
        assignments.push(
            this.fb.group({
                percentage: ["", Validators.required],
                producerId: ["", Validators.required],
                writingNumber: ["", Validators.required],
                sitCode: ["", Validators.required],
                SITCodeHierarchyList: [""],
            }),
        );
        if (this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS).value.length === 1) {
            this.intializePercentage();
        }
    }

    intializePercentage(): void {
        this.addUpdateCustomizedSplitForm
            .get(this.assignmentControlList.ASSIGNMENTS)
            [this.CONTROLS][0].get(this.assignmentControlList.PERCENTAGE)
            .setValue("100");
        if (this.roleList.length === 1) {
            this.addUpdateCustomizedSplitForm
                .get(this.assignmentControlList.ASSIGNMENTS)
                [this.CONTROLS][0].get(this.assignmentControlList.PERCENTAGE)
                .disable();
        }
    }

    /**
     * Function to remove multiple producer
     * @param index position in the form
     */
    removeMultipleProducer(index: number): void {
        const producers = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS) as FormArray;
        producers.removeAt(index);
        this.checkPercentage();
        this.checkForDuplicateWritingNumber(index);
    }

    getWritingNumberBySitCode(id: string, sitCodeId: number): string | undefined {
        if (id && id !== "" && sitCodeId) {
            let num: string;
            const producer = this.producersList.find((x) => x.id === parseInt(id, 10));
            if (producer && producer.writingNumbers.length > 0) {
                producer.writingNumbers.forEach((item) => {
                    if (item.sitCodes.find((x) => x.id === sitCodeId)) {
                        num = item.number;
                    }
                });
                return num;
            }
        }
        return undefined;
    }

    /**
     * method to return writing numbers wrt producerId and index of the producer
     * @param id: string, producerId
     * @param index: number, index of the producer
     * @returns WritingNumber[], array of active writing numbers
     * */
    getWritingNumbersByProducerId(id: string, index: number): WritingNumber[] | undefined {
        this.todayDate.setHours(0, 0, 0, 0);
        if (id && id !== "") {
            const producer = this.producersList.find((x) => x.id === parseInt(id, 10));
            if (producer) {
                const currentWritingNumber: WritingNumber[] = [];
                producer.writingNumbers.forEach((writingNumber) => {
                    currentWritingNumber.push(
                        ...writingNumber.sitCodes
                            .filter((sitCode) => {
                                if (sitCode.expirationDate) {
                                    const expirationDate = this.dateService.toDate(sitCode.expirationDate);
                                    expirationDate.setHours(0, 0, 0, 0);
                                    return expirationDate >= this.todayDate;
                                }
                                return true;
                            })
                            .map(() => writingNumber),
                    );
                    this.activeWritingNumbers[index] = {
                        writingNumbers: Array.from(new Set(currentWritingNumber)),
                    };
                });
                // return only the unique values of the array
                return Array.from(new Set(this.activeWritingNumbers[index].writingNumbers));
            }
        }
        return undefined;
    }

    /**
     * method to get sit codes wrt writing number and producerId
     * @param id: string, producerId
     * @param writingNum: string, current writing number
     * @returns SitCode, array of sit codes
     */
    getSitCodesByWritingNumberProdcuerId(id: string, writingNum: string): SitCode[] | undefined {
        if (id && id !== "" && writingNum && writingNum !== "") {
            const producer = this.producersList.find((x) => x.id === parseInt(id, 10));
            if (producer && producer.writingNumbers.length > 0) {
                const writingNumber = producer.writingNumbers.find((x) => x.number === writingNum);
                if (writingNumber && writingNumber.sitCodes.length > 0) {
                    return writingNumber.sitCodes.filter((x) => this.isSITCodeActive(x));
                }
            }
        }
        return undefined;
    }

    /**
     * method to check if sit code is active or expired
     * @param sitCode: SITCode, sit code
     * @returns boolean, true if active, false if not
     */
    isSITCodeActive(sitCode: SITCode): boolean {
        if (sitCode.expirationDate) {
            const expirationDate = this.dateService.toDate(sitCode.expirationDate);
            expirationDate.setHours(0, 0, 0, 0);
            return expirationDate >= this.todayDate;
        }
        return true;
    }

    /**
     * Function to set producerList and call function to initialise producer
     */
    retriveProducerList(): void {
        this.producersList = this.splitProducerList;
        if (!this.producerData.isUnauthorized) {
            this.intializeProducer();
        }
    }

    cancelAction(): void {
        this.cancelSingleAdd.emit();
    }

    backToStepOne(): void {
        this.addProducerStep2 = true;
        this.goBackToStepTow.emit(this.addProducerStep2);
    }
    /**
     * This function will open a pop to Display a warning message for 0/100 commission
     */
    openZeroPercentCommissionForm(): void {
        this.subscriber.push(
            this.empoweredModalService
                .openDialog(ZeroPercentCommissionComponent)
                .afterClosed()
                .pipe(filter((result) => result))
                .subscribe(() => {
                    this.onSubmit();
                }),
        );
    }

    /**
     * This function will calls  openZeroPercentCommissionForm method
     * if writing producer gets 0% commission otherwise onsubmit method will called
     */
    checkValidity(): void {
        this.showErrorMessage = false;
        if (!this.producerData.isUnauthorized) {
            this.checkPercentage();
        }
        if (this.addUpdateCustomizedSplitForm.valid && !this.duplicateWritingNumber) {
            const assignments = this.addUpdateCustomizedSplitForm.getRawValue().assignments;
            if (
                assignments.length &&
                assignments.some((split) => split.percentage === "0" && assignments[0].producerId === split.producerId)
            ) {
                // Show warning if the writing producer gets 0% commission
                this.openZeroPercentCommissionForm();
            } else {
                this.onSubmit();
            }
        } else {
            this.validateAllFormFields(this.addUpdateCustomizedSplitForm);
        }
    }
    /**
     * Function to set payload and make API call to invite producer
     */
    onSubmit(): void {
        const editCustomizedSplitValues = {
            invitedProducerIds: [],
            proposedRole: null,
            message: null,
            commissionSplitAssignments: [],
        };
        this.addUpdateCustomizedSplitForm.getRawValue().assignments.forEach((element) => {
            if (element.producerId) {
                editCustomizedSplitValues.commissionSplitAssignments.push({
                    sitCodeId: parseInt(element.sitCode, 10),
                    percent: parseFloat(element.percentage),
                });
            }
        });
        editCustomizedSplitValues.invitedProducerIds = [this.producerData.id];
        editCustomizedSplitValues.proposedRole = this.addUpdateCustomizedSplitForm.value.role
            ? this.addUpdateCustomizedSplitForm.value.role
            : null;

        editCustomizedSplitValues.message =
            this.addUpdateCustomizedSplitForm.value.message && this.addUpdateCustomizedSplitForm.value.message !== ""
                ? this.addUpdateCustomizedSplitForm.value.message
                : " ";
        if (this.roleList.length === 1) {
            editCustomizedSplitValues.proposedRole = this.roleList[0].id;
        }
        this.producerInvited = true;
        this.subscriber.push(
            this.accountService.inviteProducer(editCustomizedSplitValues, this.mpGroupId).subscribe(
                (result) => {
                    this.producerInvited = false;
                    this.cancelAction();
                },
                (error) => {
                    this.producerInvited = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            ),
        );
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else if (error.code === ClientErrorResponseType.FORBIDDEN) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.commission.producer.api.${error.status}.${error.code}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    validateAllFormFields(formGroup: FormGroup): void {
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-this-alias
        const _this = this;
        Object.keys(formGroup.controls).forEach((field) => {
            if (formGroup.controls[field] instanceof FormGroup) {
                _this.validateAllFormFields(formGroup.controls[field] as FormGroup);
            } else if (formGroup.controls[field] instanceof FormArray) {
                formGroup.controls[field][_this.CONTROLS].forEach((element) => {
                    _this.validateAllFormFields(element as FormGroup);
                });
            } else {
                formGroup.controls[field].markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * method is used to initialize producer form fields
     * and load writing numbers wrt producerId
     * @returns void
     */
    intializeProducer(): void {
        if (this.producerData && this.producerData.id && this.producerData.fullName && this.producerData.writingNumbers) {
            this.addUpdateCustomizedSplitForm
                .get(this.assignmentControlList.ASSIGNMENTS)
                [this.CONTROLS][0].get(this.assignmentControlList.PRODUCER_ID)
                .setValue(this.producerData.id.toString());
            this.addUpdateCustomizedSplitForm
                .get(this.assignmentControlList.ASSIGNMENTS)
                [this.CONTROLS][0].get(this.assignmentControlList.PRODUCER_ID)
                .disable();
            this.loadWritingNumber(this.producerData.id.toString(), this.INITIAL_INDEX);
        }
    }

    checkPercentage(): void {
        let sum = 0;
        this.sumError = "";
        this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS)[this.CONTROLS].forEach((element) => {
            sum = sum + parseInt(element.get(this.assignmentControlList.PERCENTAGE).value, 10);
        });
        const assignmentsControl = this.addUpdateCustomizedSplitForm.get(this.assignmentControlList.ASSIGNMENTS)[this.CONTROLS];
        assignmentsControl.forEach((control) => {
            control.get(this.assignmentControlList.PERCENTAGE).setErrors(null);
        });
        if (sum !== 100) {
            assignmentsControl[assignmentsControl.length - 1].get(this.assignmentControlList.PERCENTAGE).setErrors({ invalid: true });
            assignmentsControl[assignmentsControl.length - 1].get(this.assignmentControlList.PERCENTAGE).markAsTouched();
        }
    }

    /**
     * method called to load writing numbers
     * @param id: string, producerId
     * @param index: number, index of the assignment
     * @returns void
     */
    loadWritingNumber(id: string, index: number): void {
        this.getWritingNumbersByProducerId(id, index);

        this.addUpdateCustomizedSplitForm
            .get(this.assignmentControlList.ASSIGNMENTS)
            [this.CONTROLS][index].get(this.assignmentControlList.WRITING_NUMBER)
            .setValue("");
    }

    /**
     * function to set primary language strings
     * @returns void
     */
    fetchLanguageValues(): void {
        this.languageString = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.commission.producer.single.addSplit.desc",
            "primary.portal.commission.producer.single.addSplit.primaryProd",
            "primary.portal.commission.producer.single.addSplit.primaryProdDesc",
            "primary.portal.commission.producer.single.addSplit.assistingProd",
            "primary.portal.commission.producer.single.addSplit.assistingProdDesc",
            "primary.portal.commission.producer.single.addSplit.enroller",
            "primary.portal.commission.producer.single.addSplit.enrollerDesc",
            "primary.portal.commission.producer.single.addSplit.prodNotAllowed",
            "primary.portal.commission.producer.single.table.carriers",
            "primary.portal.commission.producer.single.table.availableState",
            "primary.portal.commission.producer.single.addSplit.addProducerTooltip",
            "primary.portal.commission.producer.single.addSplit.noAuthProducer",
            "primary.portal.commission.producer.single.addSplit.noAuthProducerDesc",
            "primary.portal.commissionSplit.addUpdate.duplicateWritingNumber",
            "primary.portal.commission.producer.single.addSplit.percentError",
            "primary.portal.commissionSplit.addUpdate.column.sitCode",
            "primary.portal.commissionSplit.addUpdate.noHierarchyError",
            "primary.portal.commissionSplit.addUpdate.column.sitcodehierarchy",
            "primary.portal.commissionSplit.addUpdate.column.producer",
            "primary.portal.commissionSplit.addUpdate.column.level",
            "primary.portal.commissionSplit.addUpdate.column.writingNumber",
            "primary.portal.common.select",
        ]);
        this.secondaryLanguageStrings = this.languageService.fetchSecondaryLanguageValues([
            "secondary.portal.commissionSplit.addUpdate.percentMustBe100",
        ]);
    }

    setLanguageStrings(): void {
        this.setInfo = this.languageString["primary.portal.commission.producer.single.addSplit.desc"].replace(
            "##PRODUCERNAME##",
            this.producerData.name.firstName,
        );
        this.ROLE_DETAILS =
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.primaryProd"]}</strong>
            ${this.languageString["primary.portal.commission.producer.single.addSplit.primaryProdDesc"]}</br></br>` +
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.assistingProd"]}</strong>
            ${this.languageString["primary.portal.commission.producer.single.addSplit.assistingProdDesc"]}</br></br>` +
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.enroller"]}</strong>
            ${this.languageString["primary.portal.commission.producer.single.addSplit.enrollerDesc"]}</br></br>` +
            `<strong>${this.languageString["primary.portal.commission.producer.single.addSplit.noAuthProducer"]}</strong>
            ${this.languageString["primary.portal.commission.producer.single.addSplit.noAuthProducerDesc"]}</br></br>`;
    }

    getCarrierInfo(): void {
        this.subscriber.push(
            this.producerService.getProducerInformation(this.producerData.id.toString()).subscribe((Response) => {
                // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-this-alias
                const _this = this;
                const arr = [];
                for (const licenseState of Response.licenses) {
                    for (const benState of this.benefitOfferingStatesData) {
                        if (licenseState.state.abbreviation === benState.abbreviation) {
                            arr.push(licenseState);
                        }
                    }
                }
                this.producerData.intersectedState = arr;
                this.producerData.states = this.getNotesTooltip(arr, this.STATE);
                this.producerData.carriers = this.getNotesTooltip(Response.carrierAppointments, this.CARRIER);
            }),
        );
    }

    /**
     * Check for duplicate writing number
     * @param index position in the form
     */
    checkForDuplicateWritingNumber(index: number): void {
        let duplicateWritingNumber: unknown[] = [];
        const editCustomizedSplitValues = this.addUpdateCustomizedSplitForm.getRawValue();
        if (editCustomizedSplitValues && editCustomizedSplitValues.assignments && editCustomizedSplitValues.assignments.length) {
            duplicateWritingNumber = [...new Set(editCustomizedSplitValues.assignments.map((assignments) => assignments.writingNumber))];
        }
        this.duplicateWritingNumber =
            editCustomizedSplitValues.assignments &&
            editCustomizedSplitValues.assignments.length > 1 &&
            editCustomizedSplitValues.assignments.length > duplicateWritingNumber.length;

        this.addUpdateCustomizedSplitForm
            .get(this.assignmentControlList.ASSIGNMENTS)
            [this.CONTROLS][index].get(this.assignmentControlList.SITE_CODE)
            .setValue("");

        this.hideInfoIcon = false;
    }
    /**
     * fetch BO states
     */
    getBenefitOfferingStates(): void {
        this.subscriber.push(
            this.benefitOfferingService.getBenefitOfferingSettings(this.mpGroupId).subscribe((Response) => {
                this.benefitOfferingStatesData = Response.states;
                this.getCarrierInfo();
            }),
        );
    }

    getNotesTooltip(data: any[], type: string): any {
        let tooltipString: any;
        if (type === this.STATE && data && data.length > 0) {
            const stateArr = [];
            const title = this.languageString["primary.portal.commission.producer.single.table.availableState"];
            for (const stateData of data) {
                stateArr.push(stateData.state.abbreviation + ": " + stateData.number);
            }
            tooltipString = this.utilService.refactorTooltip(stateArr, title);
        } else if (type === this.CARRIER && data && data.length > 0) {
            const carrierArr = [];
            const title = this.languageString["primary.portal.commission.producer.single.table.carriers"];
            for (const carrierData of data) {
                carrierArr.push(carrierData.carrier.name);
            }
            tooltipString = this.utilService.refactorTooltip(carrierArr, title);
        }
        return tooltipString;
    }
    /**
     * Set SIT code hierarchy value for the tooltip
     * @param index position in the form
     * @param sitCodeId SIT code number
     * @memberof AddCommissionSplitsComponent
     */
    loadSitCodeHierarchy(index: number, sitCodeId: number): void {
        this.hideInfoIcon = true;
        if (sitCodeId && this.enableSitCodeHierarchy) {
            this.isSpinnerLoading = true;
            this.subscriber.push(
                this.aflacBusinessService
                    .getSitCodeHierarchy(sitCodeId)
                    .pipe(
                        tap((SITCodeHierarchyList) => {
                            this.addUpdateCustomizedSplitForm
                                .get(this.assignmentControlList.ASSIGNMENTS)
                                [this.CONTROLS][index].get(this.assignmentControlList.SITCodeHierarchyList)
                                .setValue(SITCodeHierarchyList);
                            this.isSpinnerLoading = false;
                        }),
                    )
                    .subscribe(),
            );
        }
    }
    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
