import { DatePipe } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { Component, Inject, OnInit, Optional, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import {
    AccountService,
    ThirdPartyPlatforms,
    ThirdPartyPlatformPreview,
    BenefitsOfferingService,
    ThirdPartyPlatform,
} from "@empowered/api";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { Subject, of, Observable, Subscription } from "rxjs";
import { UserService } from "@empowered/user";
import { switchMap, filter, switchMapTo, tap, takeUntil, catchError } from "rxjs/operators";
import { AddEditThirdPartyPopUpComponent } from "../add-edit-third-party-pop-up/add-edit-third-party-pop-up.component";
import { ThirdPartyPreviewComponent } from "./third-party-preview/third-party-preview.component";
import { DateFormats, UserPermissionList, AppSettings, Validity, PlanChoice } from "@empowered/constants";
import { TPIRestrictionsForHQAccountsService, EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const START_DATE = "startDate";
const END_DATE = "endDate";
const INVALID = "INVALID";
const REQUIRED = "REQUIRED";
const HOURS_IN_DAY = 24;
const SECONDS_IN_HOUR = 3600;
const SECONDS_TO_MILLISECOND = 1000;
const DUPLICATE_POPUP = "duplicatePopup";
const TPP_AFLAC_HR_SYSTEM_ID = 14;
const AFLAC_GROUP = "AFLAC_GROUP";

interface DialogData {
    allThirdPartyPlatforms: ThirdPartyPlatform[];
    accountWiseThirdPartyPlatforms: any;
    mpGroup: number;
    type: string;
    isEqual?: boolean;
    isAdjacent?: boolean;
    isDataFound: boolean;
    isEditingExisting?: boolean;
    isDisableEditButton?: boolean;
    importType: string;
    id: number;
}

enum Actions {
    EDIT = "edit",
    ADD = "add",
    UPDATE = "update",
}

@Component({
    selector: "empowered-add-edit-third-party-platform",
    templateUrl: "./add-edit-third-party-platform.component.html",
    styleUrls: ["./add-edit-third-party-platform.component.scss"],
})
export class AddEditThirdPartyPlatformComponent implements OnInit, OnDestroy {
    addThirdPartyPlatformForm: FormGroup;
    todayDate = new Date();
    validity: Validity = {
        effectiveStarting: "",
        expiresAfter: "",
    };
    isDisableStartDate = false;
    isDisableEndDate = false;
    START_DATE = START_DATE;
    END_DATE = END_DATE;
    warningMessage: string;
    isEqual = false;
    isDisableThirdPartyPlatform = false;
    prevTPP: any;
    pastError = {
        message: "",
        field: "",
    };
    error = {
        message1: "",
        field1: "",
        message2: "",
        field2: "",
    };
    isDisableAddButton = false;
    isDisableEditButton: boolean;
    dateType: string;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.thirdParty.date_past",
        "primary.portal.thirdParty.same_date_or_before_date",
        "primary.portal.thirdParty.same_date_or_after_start_date",
        "primary.portal.thirdParty.required_field",
        "primary.portal.thirdparty.overlapdate",
        "primary.portal.thirdparty.overlap_editdate",
        "primary.portal.thirdParty.overlapEditExisting",
        "primary.portal.thirdParty.Adjacentdates_start",
        "primary.portal.thirdParty.Adjacentdates_end",
        "primary.portal.thirdParty.save",
        "primary.portal.thirdParty.savechanges",
        "primary.portal.thirdParty.addparty_platform",
        "primary.portal.thirdParty.editparty_platform",
        "primary.portal.thirdParty.startdate",
        "primary.portal.thirdParty.enddate",
        "primary.portal.thirdParty.add",
        "primary.portal.common.cancel",
        "primary.portal.thirdParty.overlapMessage",
        "primary.portal.thirdParty.adjacentMessage",
        "primary.portal.thirdParty.invalidDates",
        "primary.portal.thirdParty.duplicateDates",
        "primary.portal.thirdParty.overlappingDates",
        "primary.portal.thirdParty.adjacentDatesMessage",
        "primary.portal.common.requiredField",
        "primary.portal.common.optional",
    ]);
    updatedData: any;
    count = 0;
    date: any;
    isOverlap: boolean;
    overlapWarning: string;
    adjacentDatesWarning: string;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isThirdPartyPreviewOpened = false;
    overlappingDates = false;
    isProducer: boolean;
    subscriptions: Subscription[] = [];
    isLoading: boolean;
    allowedThirdPartyPlatformEnrollments: ThirdPartyPlatform[];

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<AddEditThirdPartyPlatformComponent>,
        private readonly fb: FormBuilder,
        private readonly accountService: AccountService,
        private readonly datePipe: DatePipe,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly user: UserService,
        private readonly staticUtil: StaticUtilService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly dateService: DateService,
    ) {}

    /**
     * life cycle hook used for initialization of form and edit form values
     */
    ngOnInit(): void {
        if (this.data.importType === AFLAC_GROUP) {
            this.allowedThirdPartyPlatformEnrollments = this.data.allThirdPartyPlatforms.filter((res) => res.aflacGroupEnrollmentAllowed);
        } else {
            this.allowedThirdPartyPlatformEnrollments = this.data.allThirdPartyPlatforms;
        }

        this.subscriptions.push(
            this.user.portal$
                .pipe(
                    filter((portal) => portal === AppSettings.PORTAL_PRODUCER.toLowerCase()),
                    tap((_) => (this.isLoading = true)),
                    switchMapTo(this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount()),
                    switchMap((canAccessHq) =>
                        !canAccessHq ? this.staticUtil.hasPermission(UserPermissionList.AFLAC_HQ_TPP_ACCESS) : of(false),
                    ),
                )
                .subscribe((res: boolean) => {
                    this.allowedThirdPartyPlatformEnrollments = this.allowedThirdPartyPlatformEnrollments.filter((tpp) =>
                        res ? tpp.id === TPP_AFLAC_HR_SYSTEM_ID : tpp.id !== TPP_AFLAC_HR_SYSTEM_ID,
                    );
                    this.isLoading = false;
                }),
        );
        this.date = this.convertDate(this.todayDate);
        this.addThirdPartyPlatformForm = this.fb.group({
            thirdPartyPlatform: this.fb.control("", Validators.required),
            startDate: this.fb.control("", [Validators.required]),
            endDate: this.fb.control(""),
        });

        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (this.data.type === Actions.EDIT) {
            if (this.data.accountWiseThirdPartyPlatforms && this.data.accountWiseThirdPartyPlatforms.length > 0) {
                this.data.accountWiseThirdPartyPlatforms.forEach((el) => {
                    if (this.data.allThirdPartyPlatforms && this.data.allThirdPartyPlatforms.length > 0 && el.id === this.data.id) {
                        this.addThirdPartyPlatformForm.controls["thirdPartyPlatform"].setValue(this.data.allThirdPartyPlatforms[0].id);
                        this.isDisableThirdPartyPlatform = true;
                        const convertedDate = this.convertDate(el.validity.effectiveStarting, el.validity.expiresAfter, Actions.EDIT);
                        if (convertedDate.startDate) {
                            this.addThirdPartyPlatformForm.controls[START_DATE].setValue(convertedDate.startDate);
                            this.addThirdPartyPlatformForm.controls[END_DATE].setValue(convertedDate.endDate);
                            this.isDisableStartDate = convertedDate.startDate <= this.date.date;
                            this.isDisableEndDate = convertedDate.endDate <= this.date.date;
                        } else if (convertedDate.date) {
                            this.addThirdPartyPlatformForm.controls[START_DATE].setValue(convertedDate.date);
                            this.isDisableStartDate = convertedDate.date <= this.date.date;
                        }
                    }
                });
            }
        }
        this.isDisableEditButton = this.data.isDisableEditButton;
    }

    /**
     * Method to create a new tpp account
     * @returns void
     */
    createAccountThirdPartyPlatform(): void {
        if (this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value) {
            const selectedThirdPartyPlatformId = this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value;
            this.showValidationErrors();
            this.addValidityForNewTPP();
            const createAccountRequest = {
                thirdPartyPlatformId: selectedThirdPartyPlatformId,
                validity: this.validity,
                type: Actions.ADD,
            };
            this.createUpdateThirdPartyPlatform(createAccountRequest);
        }
    }
    /**
     * This method is used to create or update third party platform and check whether it's affecting BO.
     * @param createAccountRequest is the payload request which has to be updated / created
     */
    createUpdateThirdPartyPlatform(createAccountRequest: { thirdPartyPlatformId: number; validity: Validity; type: string }): void {
        let hasVASPlans = false;
        let thirdPartyPlatformReview: ThirdPartyPlatformPreview;
        this.isLoading = true;
        this.accountService
            .getThirdPartyPlatformPreview(createAccountRequest.thirdPartyPlatformId)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res: ThirdPartyPlatformPreview) => {
                    thirdPartyPlatformReview = res;
                    if (!res.affectsBenefitOffering) {
                        return this.getThirdPartyPlatformObservable(createAccountRequest);
                    }
                    this.isThirdPartyPreviewOpened = true;
                    return this.benefitsService.getPlanChoices(true, false, this.data.mpGroup, "planId,plan.productId");
                }),
                tap((choices: PlanChoice[]) => {
                    hasVASPlans = choices
                        .filter(
                            (eachChoice) =>
                                thirdPartyPlatformReview.plansToRemove.findIndex((eachPlan) => eachPlan === eachChoice.plan.name) !== -1 &&
                                eachChoice.requiredSetup,
                        )
                        .some((planChoice) => planChoice.plan.product.valueAddedService);
                }),
                switchMap((response) =>
                    this.empoweredModalService.openDialog(ThirdPartyPreviewComponent, { data: thirdPartyPlatformReview }).afterClosed(),
                ),
                filter((res) => this.isThirdPartyPreviewOpened),
                switchMap((response: boolean) => {
                    if (response === null || response === undefined) {
                        this.isThirdPartyPreviewOpened = false;
                        this.closeAddPopup();
                        return of(null);
                    }
                    if (response && hasVASPlans) {
                        this.isLoading = true;
                        return this.benefitsService
                            .cancelApprovalRequest(this.data.mpGroup)
                            .pipe(switchMap((res) => this.getThirdPartyPlatformObservable(createAccountRequest)));
                    }
                    if (response) {
                        this.isLoading = true;
                        return this.getThirdPartyPlatformObservable(createAccountRequest);
                    }
                    this.isThirdPartyPreviewOpened = false;
                    return of(null);
                }),
                tap((res) => {
                    this.isLoading = false;
                }),
                catchError((res) => {
                    this.isLoading = false;
                    this.isThirdPartyPreviewOpened = false;
                    return of(null);
                }),
            )
            .subscribe();
    }
    /**
     * This method is used return create or update third party platform observable based on type
     * @param createAccountRequest is the payload request which has to be updated / created
     * @returns an observable to create or update third party platform observable based on type
     */
    getThirdPartyPlatformObservable(createAccountRequest: {
        thirdPartyPlatformId: number;
        validity: Validity;
        type: string;
    }): Observable<HttpResponse<void>> {
        if (createAccountRequest.type === Actions.ADD) {
            return this.accountService.createAccountThirdPartyPlatform(this.data.mpGroup.toString(), createAccountRequest).pipe(
                tap(() => {
                    this.closeAddPopup(createAccountRequest);
                }),
            );
        }
        return this.accountService
            .updateAccountThirdPartyPlatform(createAccountRequest.thirdPartyPlatformId, this.data.mpGroup, createAccountRequest.validity)
            .pipe(
                tap((updateResp) => {
                    if (updateResp.status === AppSettings.API_RESP_204 && this.data.type === Actions.EDIT) {
                        this.closeAddPopup(Actions.UPDATE);
                    }
                }),
            );
    }

    /**
     * onBlurEvt() method is to check whether the required field is touched and without value.
     */
    onBlurEvt(): void {
        if (this.addThirdPartyPlatformForm.get(START_DATE).errors.required && !this.addThirdPartyPlatformForm.get(START_DATE).value) {
            this.showFormatValidationErrors(REQUIRED);
        }
    }
    /**
     * Function to validate the date fields on dateChange event
     * @params dateType : string declare the type of field on which even is getting trigger
     */
    addEvent(dateType?: string): void {
        let convertedDate: any;
        this.isDisableAddButton = false;
        if (this.data.type === Actions.EDIT) {
            this.isDisableEditButton = false;
        }
        this.dateType = dateType ? dateType : "";
        if (this.data.accountWiseThirdPartyPlatforms && this.data.accountWiseThirdPartyPlatforms.length > 0) {
            if (
                (this.addThirdPartyPlatformForm.get(START_DATE).status === INVALID &&
                    this.addThirdPartyPlatformForm.get(START_DATE).dirty) ||
                (this.addThirdPartyPlatformForm.get(END_DATE).status === INVALID && this.addThirdPartyPlatformForm.get(END_DATE).dirty)
            ) {
                if (this.pastError.field !== "") {
                    this.pastError.field = "";
                    this.addThirdPartyPlatformForm.get(START_DATE).setErrors(null);
                    this.addThirdPartyPlatformForm.get(END_DATE).setErrors(null);
                }
                this.showValidationErrors();
            } else if (
                this.addThirdPartyPlatformForm.get(START_DATE).value === "" &&
                this.addThirdPartyPlatformForm.get(END_DATE).value !== ""
            ) {
                this.pastError.field = START_DATE;
                this.pastError.message = "Required field";
                this.addThirdPartyPlatformForm.controls.startDate.setErrors({ invalid: true });
                this.isDisableAddButton = true;
            } else if (
                this.addThirdPartyPlatformForm.get(START_DATE).value !== "" &&
                this.addThirdPartyPlatformForm.get(END_DATE).value !== ""
            ) {
                this.showValidationErrors();
                this.data.accountWiseThirdPartyPlatforms.forEach((el) => {
                    if (
                        el.thirdPartyPlatform.id === this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value &&
                        this.addThirdPartyPlatformForm.get(START_DATE).value !== "" &&
                        this.addThirdPartyPlatformForm.get(END_DATE).value.value !== ""
                    ) {
                        convertedDate = this.convertDate(
                            this.addThirdPartyPlatformForm.get(START_DATE).value,
                            this.addThirdPartyPlatformForm.get(END_DATE).value,
                        );
                        this.updatedData = {
                            id: el.id,
                            thirdPartyPlatform: el.thirdPartyPlatform,
                            validity: {
                                effectiveStarting: convertedDate.startDate,
                                expiresAfter: convertedDate.endDate,
                            },
                        };
                        this.checkForOverlap(this.updatedData, this.date.date);
                    } else if (
                        el.thirdPartyPlatform.id !== this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value &&
                        this.addThirdPartyPlatformForm.get(START_DATE).value !== "" &&
                        this.addThirdPartyPlatformForm.get(END_DATE).value.value !== ""
                    ) {
                        this.showValidationErrors();
                        convertedDate = this.convertDate(
                            this.addThirdPartyPlatformForm.get(START_DATE).value,
                            this.addThirdPartyPlatformForm.get(END_DATE).value,
                        );
                        this.updatedData = {
                            id: el.id,
                            thirdPartyPlatform: el.thirdPartyPlatform,
                            validity: {
                                effectiveStarting: convertedDate.startDate,
                                expiresAfter: convertedDate.endDate,
                            },
                        };
                        this.checkForOverlap(this.updatedData, this.date.date);
                    } else if (
                        this.addThirdPartyPlatformForm.get(START_DATE).value !== "" &&
                        this.addThirdPartyPlatformForm.get(END_DATE).value.value !== ""
                    ) {
                        this.addValidityForNewTPP();
                    }
                });
            } else if (
                this.addThirdPartyPlatformForm.get(START_DATE).value !== "" &&
                this.addThirdPartyPlatformForm.get(END_DATE).value === ""
            ) {
                this.showValidationErrors();
                this.count = this.count + 1;
                if (
                    this.count === 2 &&
                    this.addThirdPartyPlatformForm.get(START_DATE).value !== "" &&
                    this.addThirdPartyPlatformForm.get(END_DATE).value !== "" &&
                    this.data.type === Actions.ADD
                ) {
                    this.data.accountWiseThirdPartyPlatforms.forEach((element) => {
                        if (element.id === this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value) {
                            this.updatedData = {
                                id: element.id,
                                thirdPartyPlatform: element.thirdPartyPlatform,
                                validity: {
                                    effectiveStarting: convertedDate.startDate,
                                    expiresAfter: convertedDate.endDate,
                                },
                            };
                            this.checkForOverlap(this.updatedData, this.date.date);
                        }
                    });
                }
            }
        } else {
            this.showValidationErrors();
        }
    }
    /**
     * Method to check if overlap or adjacent dates and show dialog box or alert appropriately
     * @param validity - validity of the selected tpp
     * @param element - tpp Data
     */
    checkForAdjacentDates(validity: Validity, element: ThirdPartyPlatforms): void {
        let existingTPPData: ThirdPartyPlatforms;
        const AdjacentThresholdDifference = 1;
        this.data.accountWiseThirdPartyPlatforms.forEach((ele) => {
            if (ele.thirdPartyPlatform.id === this.addThirdPartyPlatformForm.value.thirdPartyPlatform) {
                const diff = this.compareDateForAdjacentOrOverlap(
                    this.dateService.toDate(ele.validity.expiresAfter),
                    this.dateService.toDate(validity.effectiveStarting),
                );
                if (diff === AdjacentThresholdDifference) {
                    existingTPPData = ele;
                    this.data.isAdjacent = true;
                }
            } else {
                this.checkIfOverlap(ele, true);
            }
        });
        if (typeof existingTPPData !== "undefined") {
            const data = this.languageStrings["primary.portal.thirdParty.adjacentDatesMessage"].replace(
                /##tppName##/g,
                existingTPPData.thirdPartyPlatform.name,
            );
            const dialogRef = this.empoweredModalService.openDialog(AddEditThirdPartyPopUpComponent, {
                data: data,
            });
            dialogRef.afterClosed().subscribe((modalResponse) => {
                if (modalResponse === this.languageStrings["primary.portal.thirdParty.overlapEditExisting"]) {
                    this.editExisting(null, existingTPPData);
                } else {
                    this.matDialogRef.close();
                }
            });
        }
    }

    /**
     * Method to find adjacent date or overlapping date
     * @param date1 - Tpp expiry date
     * @param date2 - Tpp start date
     * @return - no of days between the dates or a string
     */
    compareDateForAdjacentOrOverlap(date1: Date, date2: Date): number {
        const zeroInCaseNoOverlap = 0;
        const adjacentDateThreshold = 1;
        let result: any;
        if (date1 > date2) {
            result = this.differenceBetweenDates(date1, date2);
        } else if (date1 < date2) {
            result = this.differenceBetweenDates(date1, date2) === adjacentDateThreshold ? adjacentDateThreshold : zeroInCaseNoOverlap;
        } else {
            result = zeroInCaseNoOverlap;
        }
        return result;
    }

    /**
     * Method to find the number of days between the two dates
     * @param date1 future date
     * @param date2 previous date
     * @return difference between the dates
     */
    differenceBetweenDates(date1: Date, date2: Date): number {
        const diffInTime = date1.getTime() - date2.getTime();
        const diffInDays = Math.abs(diffInTime / (SECONDS_TO_MILLISECOND * SECONDS_IN_HOUR * HOURS_IN_DAY));
        return diffInDays;
    }

    /**
     * Method to update the existing tpp data
     * @param accountWiseData - list of tpp
     * @returns void
     */
    updateExistingTPP(accountWiseData?: any): void {
        const tppId = this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value;
        const updateTppRequest = {} as Validity;
        if (accountWiseData && accountWiseData.length > 0) {
            accountWiseData.forEach((el) => {
                if (el.thirdPartyPlatform.id === tppId) {
                    updateTppRequest.effectiveStarting = this.datePipe.transform(
                        this.addThirdPartyPlatformForm.get(START_DATE).value,
                        AppSettings.DATE_FORMAT_YYYY_MM_DD,
                    );
                    updateTppRequest.expiresAfter = this.datePipe.transform(
                        this.addThirdPartyPlatformForm.get(END_DATE).value,
                        AppSettings.DATE_FORMAT_YYYY_MM_DD,
                    );
                }
            });
        }
        this.getThirdPartyPlatformObservable({
            thirdPartyPlatformId: tppId,
            validity: updateTppRequest,
            type: Actions.UPDATE,
        })
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    closeAddPopup(createAccountRequest?: any): void {
        this.matDialogRef.close(createAccountRequest);
    }

    getTPPName(val: number): any {
        let name: any;
        if (this.data.allThirdPartyPlatforms && this.data.allThirdPartyPlatforms.length > 0) {
            const index = this.data.allThirdPartyPlatforms.findIndex((x) => x.id === val);
            name = index > -1 ? this.data.allThirdPartyPlatforms[index].name : "";
        }
        return name;
    }

    /**
     * Method to open overlap or duplicate popup
     * @param data - tpp data
     * @param isEqual - check for duplicate
     * @param isOverlap - check for overlap
     */
    showOverlapPopup(data: ThirdPartyPlatforms, isEqual: boolean, isOverlap: boolean): void {
        this.prevTPP = data.thirdPartyPlatform.name;
        if (isEqual === true) {
            this.isEqual = isEqual;
        }

        const dialogData: MonDialogData = {
            title: isOverlap
                ? this.languageStrings["primary.portal.thirdParty.overlappingDates"]
                : this.languageStrings["primary.portal.thirdParty.duplicateDates"],
            content: this.createWarningMessage(data),
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.thirdParty.overlapEditExisting"],
                buttonAction: this.editExisting.bind(this, this.dialog, data),
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                buttonAction: this.close.bind(this, this.dialog),
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }

    /**
     * Method to form the warning message for adjacent or overlap dates
     * @param data - tpp data
     * @return - warning message
     */
    createWarningMessage(data: ThirdPartyPlatforms): string {
        const dateFormatToDisplay = DateFormats.MONTH_DAY_YEAR;
        const startDate = data.validity.effectiveStarting;
        const endDate = data.validity.expiresAfter;
        this.overlapWarning = this.languageStrings["primary.portal.thirdParty.overlapMessage"];
        this.adjacentDatesWarning = this.languageStrings["primary.portal.thirdParty.adjacentMessage"];
        const message: string = this.adjacentDatesWarning
            .replace("##tppName##", data.thirdPartyPlatform.name)
            .replace("##startDate##", this.datePipe.transform(startDate, dateFormatToDisplay))
            .replace("##expiryDate##", this.datePipe.transform(endDate, dateFormatToDisplay))
            .replace("##tppName##", data.thirdPartyPlatform.name);
        return message;
    }

    /**
     * Method called to edit the existing tpp data
     * @param data - dialog data
     * @param ele - tpp data
     */
    editExisting(data: MatDialog, ele: ThirdPartyPlatforms): void {
        const convertedDate = this.convertDate(ele.validity.effectiveStarting, ele.validity.expiresAfter, Actions.EDIT);
        const existingTPP = [
            {
                aflacGroupEnrollmentAllowed: ele.thirdPartyPlatform.aflacGroupEnrollmentAllowed,
                id: ele.thirdPartyPlatform.id,
                name: ele.thirdPartyPlatform.name,
            },
        ];
        const startDate = convertedDate.startDate ? convertedDate.startDate : convertedDate.date;
        this.isDisableStartDate = startDate <= this.date.date;
        this.isDisableEndDate = convertedDate.endDate <= this.date.date;
        this.data.type = Actions.EDIT;
        this.allowedThirdPartyPlatformEnrollments = existingTPP;

        if (this.allowedThirdPartyPlatformEnrollments && this.allowedThirdPartyPlatformEnrollments.length) {
            this.addThirdPartyPlatformForm.controls["thirdPartyPlatform"].setValue(this.allowedThirdPartyPlatformEnrollments[0].id);
            this.isDisableThirdPartyPlatform = true;
        }
        this.addThirdPartyPlatformForm.controls[START_DATE].setValue(convertedDate.startDate);
        this.addThirdPartyPlatformForm.controls[END_DATE].setValue(convertedDate.endDate);
    }

    /**
     * Method to convert the date into a particular format.
     * @param date1 - start date
     * @param date2 - end date
     * @param type - duplicate or adjacent or overlap
     * @returns - an object with date/dates in a particular format
     */
    convertDate(date1: any, date2?: any, type?: string): any {
        let convertedDate;

        if (date1 !== undefined && date2 === undefined) {
            date1 = this.datePipe.transform(date1, AppSettings.DATE_FORMAT);
            convertedDate = { date: date1 };
        } else {
            date1 = this.datePipe.transform(date1, AppSettings.DATE_FORMAT);
            date2 = this.datePipe.transform(date2, AppSettings.DATE_FORMAT);

            if (type === DUPLICATE_POPUP) {
                let p = date1.split(/\D/g);
                date1 = [p[2], p[1], p[0]].join("/");
                p = date2.split(/\D/g);
                date2 = [p[2], p[1], p[0]].join("/");
            }
            convertedDate = { startDate: date1, endDate: date2 };
        }
        return convertedDate;
    }

    close(ele: any): any {
        ele.closeAll();
    }

    /**
     * Method to show overlap or adjacent popup
     * @param data - tpp data
     * @param date - present date
     */
    compareDates(data: ThirdPartyPlatforms, date: Date): void {
        if (this.data.accountWiseThirdPartyPlatforms.length > 0) {
            this.data.accountWiseThirdPartyPlatforms.forEach((ele) => {
                if (ele.thirdPartyPlatform.id === data.thirdPartyPlatform.id) {
                    if (
                        ele.validity.effectiveStarting === data.validity.effectiveStarting &&
                        ele.validity.expiresAfter === data.validity.expiresAfter
                    ) {
                        this.overlappingDates = true;
                        this.showOverlapPopup(ele, true, false);
                    } else if (
                        (ele.validity.effectiveStarting !== data.validity.effectiveStarting ||
                            ele.validity.expiresAfter !== data.validity.expiresAfter) &&
                        typeof this.data.isAdjacent === "undefined"
                    ) {
                        this.checkForAdjacentDates(this.validity, ele);
                    }
                } else {
                    this.checkIfOverlap(ele);
                }
            });
        }
    }

    /**
     * Function to check whether the dates are overlapping.
     * @param data : ThirdPartyPlatforms
     * @param fromAdjacent : boolean
     * @returns void
     */
    checkIfOverlap(data: ThirdPartyPlatforms, fromAdjacent?: boolean): void {
        const tpp = this.addThirdPartyPlatformForm.get("thirdPartyPlatform").value;
        const effectiveStarting = data.validity.effectiveStarting;
        if (data.thirdPartyPlatform.id !== tpp) {
            const convertedDate = this.convertDate(
                this.addThirdPartyPlatformForm.get(START_DATE).value,
                this.addThirdPartyPlatformForm.get(END_DATE).value,
            );
            const startDateCondition = fromAdjacent
                ? effectiveStarting <= convertedDate.startDate
                : effectiveStarting <= convertedDate.startDate || effectiveStarting > convertedDate.startDate;
            const futureDatesCondition = !(effectiveStarting > convertedDate.endDate);
            if (
                startDateCondition &&
                data.validity.expiresAfter >= convertedDate.startDate &&
                !this.overlappingDates &&
                futureDatesCondition
            ) {
                this.overlappingDates = true;
                this.showOverlapPopup(data, false, true);
            }
        }
    }

    /**
     * Method to check overlap of dates
     * @param data - tpp date
     * @param currentDate - present date
     */
    checkForOverlap(data: ThirdPartyPlatforms, currentDate: Date): void {
        this.validity.effectiveStarting =
            this.data.type === Actions.ADD || this.data.type === Actions.EDIT ? data.validity.effectiveStarting : "";
        this.validity.expiresAfter = this.data.type === Actions.ADD || this.data.type === Actions.EDIT ? data.validity.expiresAfter : "";

        if (this.validity.effectiveStarting !== "" && this.validity.expiresAfter !== "") {
            if ((this.data.type === Actions.ADD || this.data.type === Actions.EDIT) && typeof this.data.isAdjacent === "undefined") {
                this.compareDates(data, currentDate);
            } else if (this.data.isAdjacent === true && this.data.type === Actions.EDIT) {
                this.compareDates(data, currentDate);
            }
        }
    }
    /**
     * Function to convert the start and end date values from the form into the required format
     * Pushing the converted values into validity
     */
    addValidityForNewTPP(): void {
        if (this.addThirdPartyPlatformForm.get(START_DATE).value !== "") {
            const convertedDate = this.convertDate(
                this.addThirdPartyPlatformForm.get(START_DATE).value,
                this.addThirdPartyPlatformForm.get(END_DATE).value,
            );

            this.validity.effectiveStarting = convertedDate.startDate;
            this.validity.expiresAfter = convertedDate.endDate;
        }
    }

    /**
     * Method : showFormatValidationErrors() to validate the format related error messages.
     * @param isStatus:string is a required parameter to check the conditions like Invalid format
     */

    showFormatValidationErrors(isStatus: string): void {
        if (isStatus === INVALID) {
            this.pastError.message = this.languageStrings["primary.portal.thirdParty.invalidDates"];
            this.pastError.field = this.dateType;
            this.addThirdPartyPlatformForm.get(this.dateType).setErrors({ invalid: true });
            this.isDisableAddButton = true;
        } else if (isStatus === REQUIRED) {
            this.pastError.message = this.languageStrings["primary.portal.thirdParty.required_field"];
            this.pastError.field = START_DATE;
        }
    }

    /**
     * Method : showValidationErrors() to validate the date input fields.
     * Error message should be displayed for the following 4 different scenarios:
     * 1. Start date should not be blank.
     * 2. Start date should be greater than or equals to today's date.
     * 3. Start date should be lesser than end date.
     * 4. End date should be greater than start date.
     */
    showValidationErrors(): void {
        const startDate = this.addThirdPartyPlatformForm.get(START_DATE).value;
        const endDate = this.addThirdPartyPlatformForm.get(END_DATE).value;
        if (startDate === null) {
            this.dateType = START_DATE;
            this.showFormatValidationErrors(INVALID);
        } else if (endDate === null) {
            this.dateType = END_DATE;
            this.addThirdPartyPlatformForm.get(END_DATE).setValue(null);
            this.addThirdPartyPlatformForm.get(END_DATE).setErrors(null);
        } else if ((startDate !== "" && startDate.value !== "") || (endDate !== "" && endDate.value !== "")) {
            const convertedDate = this.convertDate(startDate, endDate, Actions.ADD);
            if (this.pastError.field !== "") {
                this.pastError.field = "";
                this.addThirdPartyPlatformForm.get(START_DATE).setErrors(null);
                this.addThirdPartyPlatformForm.get(END_DATE).setErrors(null);
            }
            if (convertedDate.startDate < this.date.date && this.dateType === START_DATE) {
                this.pastError.message = this.languageStrings["primary.portal.thirdParty.date_past"];
                this.pastError.field = START_DATE;
                this.addThirdPartyPlatformForm.get(START_DATE).setErrors({ invalid: true });
                this.isDisableAddButton = true;
            }
            if ((convertedDate.endDate < this.date.date || convertedDate.startDate > convertedDate.endDate) && this.dateType === END_DATE) {
                this.pastError.message = this.languageStrings["primary.portal.thirdParty.same_date_or_after_start_date"];
                this.pastError.field = END_DATE;
                this.addThirdPartyPlatformForm.get(END_DATE).setErrors({ invalid: true });
                this.isDisableAddButton = true;
            }
            if (convertedDate.startDate > convertedDate.endDate && this.dateType === START_DATE) {
                this.pastError.message = this.languageStrings["primary.portal.thirdParty.same_date_or_before_date"];
                this.pastError.field = START_DATE;
                this.addThirdPartyPlatformForm.get(START_DATE).setErrors({ invalid: true });
                this.isDisableAddButton = true;
            }
        } else if (startDate === "" && endDate === "") {
            this.pastError.message = this.languageStrings["primary.portal.thirdParty.required_field"];
            this.pastError.field = START_DATE;
        }
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.subscriptions.forEach((el) => el.unsubscribe());
    }
}
