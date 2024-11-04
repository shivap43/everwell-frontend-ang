import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { AflacService, AflacGroupLocationInformation, ShoppingCartDisplayService } from "@empowered/api";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { forkJoin, Subject } from "rxjs";
import { takeUntil, switchMap } from "rxjs/operators";
import { EnrollmentState, UpdateApplicationResponse, AppFlowService } from "@empowered/ngxs-store";

import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";

import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    ResponsePanel,
    ResponseItem,
    StepData,
    CompanyCode,
    WritingNumber,
    Step,
    ApplicationResponse,
    AgAppResponse,
    StepType,
} from "@empowered/constants";

enum SelectionTypes {
    WRITING_NUMBER = "WRITING_NUMBER",
    DEDUCTION_FREQUENCY = "DEDUCTION_FREQUENCY",
    GROUP_LOCATION = "GROUP_LOCATION",
}
interface OptionsDisplay<T> {
    value: T;
    viewValue: string;
}

@Component({
    selector: "empowered-ag-group-information",
    templateUrl: "./ag-group-information.component.html",
    styleUrls: ["./ag-group-information.component.scss"],
})
export class AgGroupInformationComponent implements OnInit, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    @Input() riderIndex: number;
    private readonly unsubscribe$ = new Subject<void>();
    displayWritingNumber = false;
    displayWritingNumberOptions: OptionsDisplay<string>[] = [];
    displayGroupLocations = false;
    displayGroupLocationsOptions: OptionsDisplay<string>[] = [];
    displayDeductionFrequency = false;
    displayDeductionFrequencyOptions: OptionsDisplay<string>[] = [];
    mpGroup: number;
    memberId: number;
    form: FormGroup;
    writingNumberError = false;
    sectionSteps: Step[] = [];
    showSpinner = false;
    errorMessage = "";
    SelectionTypes = SelectionTypes;
    planResponse: ResponseItem;
    stepId: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.agInformation.agentInformation",
        "primary.portal.agInformation.additionalInformation",
        "primary.portal.agInformation.appropriateWritingNumber",
        "primary.portal.agInformation.provideInfo",
        "primary.portal.tpiEnrollment.writingNumber",
        "primary.portal.agInformation.agLocation",
        "primary.portal.agInformation.deductionFrequency",
        "primary.portal.common.next",
        "primary.portal.common.placeholderSelect",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly aflacService: AflacService,
        private readonly appFlowService: AppFlowService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly shoppingCartService: ShoppingCartDisplayService,
    ) {}

    /**
     * This function will run on component init to set data to be displayed
     */
    ngOnInit(): void {
        this.setPlanResponse();
        this.setDisplayFlagBooleans();
        this.getDataToRenderOptions();
        this.subscribeToFormValueChanges();
    }
    /**
     * This function will set boolean flags to display different selection options
     */
    setDisplayFlagBooleans(): void {
        this.sectionSteps = this.planObject.steps;
        this.stepId = this.sectionSteps[0].id;
        this.displayWritingNumber = this.sectionSteps[0].writingNumberApplicable;
        this.displayGroupLocations = this.sectionSteps[0].aflacGroupLocationApplicable;
        this.displayDeductionFrequency = this.sectionSteps[0].deductionFrequencyApplicable;
        this.validateSkipConstraint();
    }
    /**
     * This function will get and set the selection options dropdown data
     */
    getDataToRenderOptions(): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.form = this.fb.group({});
        if (this.displayWritingNumber) {
            this.form.addControl(
                SelectionTypes.WRITING_NUMBER,
                this.fb.control(this.getValueToBePrePopulated(this.stepId, SelectionTypes.WRITING_NUMBER), Validators.required),
            );
            forkJoin([this.aflacService.getSitCodes(CompanyCode.NY), this.aflacService.getSitCodes(CompanyCode.US)])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([nySitCodes, usSitCodes]: [WritingNumber[], WritingNumber[]]) => {
                    this.displayWritingNumberOptions = [];
                    if (nySitCodes.length > 0 || usSitCodes.length > 0) {
                        this.displayWritingNumberOptions = nySitCodes.map((writingNumber) => ({
                            value: writingNumber.number,
                            viewValue: writingNumber.number,
                        }));
                        this.displayWritingNumberOptions = usSitCodes.map((writingNumber) => ({
                            value: writingNumber.number,
                            viewValue: writingNumber.number,
                        }));
                    } else {
                        this.form.removeControl(SelectionTypes.WRITING_NUMBER);
                        this.displayWritingNumber = false;
                        this.validateSkipConstraint();
                    }
                });
        }
        if (this.displayGroupLocations) {
            this.form.addControl(
                SelectionTypes.GROUP_LOCATION,
                this.fb.control(this.getValueToBePrePopulated(this.stepId, SelectionTypes.GROUP_LOCATION), Validators.required),
            );
            this.aflacService
                .getAflacGroupLocationInformation(this.mpGroup.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp: AflacGroupLocationInformation[]) => {
                    const distinctLocations = Array.from(new Set(resp));
                    this.displayGroupLocationsOptions = [];
                    if (distinctLocations.length > 0) {
                        distinctLocations.forEach((location) => {
                            const locationValue = `${location.address.state}-${location.locationName}`;
                            this.displayGroupLocationsOptions.push({
                                value: locationValue,
                                viewValue: locationValue,
                            });
                        });
                    } else {
                        this.form.removeControl(SelectionTypes.GROUP_LOCATION);
                        this.displayGroupLocations = false;
                        this.validateSkipConstraint();
                    }
                });
        }
        if (this.displayDeductionFrequency) {
            this.form.addControl(
                SelectionTypes.DEDUCTION_FREQUENCY,
                this.fb.control(this.getValueToBePrePopulated(this.stepId, SelectionTypes.DEDUCTION_FREQUENCY), Validators.required),
            );
            this.aflacService
                .getAflacGroupDeductionFrequencies(this.mpGroup.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resp: string[]) => {
                    this.displayDeductionFrequencyOptions = [];
                    if (resp.length > 0) {
                        resp.forEach((frequency) => {
                            this.displayDeductionFrequencyOptions.push({ value: frequency, viewValue: frequency });
                        });
                    } else {
                        this.form.removeControl(SelectionTypes.DEDUCTION_FREQUENCY);
                        this.displayDeductionFrequency = false;
                        this.validateSkipConstraint();
                    }
                });
        }
    }
    /**
     * This function will subscribe to form value changes ot update the current step in app-flow
     */
    subscribeToFormValueChanges(): void {
        this.form.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (
                this.form.dirty &&
                !this.planObject.rider &&
                (this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                if (this.planObject.reinstate) {
                    this.appFlowService.updateReinstateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                    });
                } else {
                    this.appFlowService.updateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                        planObject: this.planObject,
                    });
                }
            }
            if (
                this.form.dirty &&
                this.planObject.rider &&
                (this.planObject.rider.riderIndex !== this.riderIndex ||
                    this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
                this.appFlowService.updateRiderActiveStepDetails$.next({
                    currentRiderIndex: this.planObject.rider.riderIndex,
                    currentSectionIndex: this.planObject.rider.riderSectionIndex,
                    currentStepIndex: this.planObject.rider.riderStepIndex,
                });
            }
        });
    }
    /**
     * This function will skip the step and move to next step without saving application response
     */
    skipStep(): void {
        this.appFlowService.demographicsStepSkipped$.next({
            planObject: this.planObject,
            currentStep: this.planObject.currentStep,
            sectionId: this.planObject.currentSection.sectionId,
        });
    }
    /**
     * This function is triggered on onSubmit of selection form
     */
    onSubmit(): void {
        if (this.form.invalid || this.writingNumberError) {
            return;
        }
        this.saveApplicationResponse();
    }
    /**
     *this function will save application response
     */
    saveApplicationResponse(): void {
        this.shoppingCartService
            .saveApplicationResponse(
                this.memberId,
                this.planObject.application.cartData.id,
                this.mpGroup,
                this.getResponseObjectsToBeUpdated(),
            )
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((response) =>
                    this.store.dispatch(
                        new UpdateApplicationResponse(this.memberId, this.planObject.application.cartData.id, this.mpGroup),
                    ),
                ),
            )
            .subscribe((resp) => this.onNext());
    }
    /**
     * This function will navigate to next step in app-flow
     */
    onNext(): void {
        this.form.markAsPristine();
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    /**
     * This function will return the response object to be updated to database
     * @returns ApplicationResponse object array which has to be updated to db
     */
    getResponseObjectsToBeUpdated(): ApplicationResponse[] {
        const valueToReturn: ApplicationResponse[] = [];
        valueToReturn.push({
            stepId: this.stepId,
            type: StepType.AG_LOCATION_DEDUCTION_FREQUENCY,
            value: [
                {
                    writingNumber: this.displayWritingNumber ? this.form.controls[SelectionTypes.WRITING_NUMBER].value : "",
                    aflacGroupLocation: this.displayGroupLocations ? this.form.controls[SelectionTypes.GROUP_LOCATION].value : "",
                    deductionFrequency: this.displayDeductionFrequency ? this.form.controls[SelectionTypes.DEDUCTION_FREQUENCY].value : "",
                },
            ],
        });
        return valueToReturn;
    }
    /**
     * This function will validate the writing number selected
     */
    validateWritingNumber(): void {
        this.showSpinner = true;
        const writingNumber = this.form.controls[SelectionTypes.WRITING_NUMBER].value;
        this.aflacService
            .validateWritingNumberForAflacCartItem(
                this.mpGroup.toString(),
                this.memberId,
                this.planObject.application.cartData.id,
                writingNumber.toString(),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.writingNumberError = false;
                    this.showSpinner = false;
                },
                (err) => {
                    this.writingNumberError = true;
                    this.showSpinner = false;
                    if (err.error.details && err.error.details.length > 0) {
                        this.errorMessage = err.error.details[0].message;
                    } else if (
                        err.error.status === ClientErrorResponseCode.RESP_403 ||
                        err.error.status === ServerErrorResponseCode.RESP_503 ||
                        err.error.status === ServerErrorResponseCode.RESP_500
                    ) {
                        this.errorMessage = err.error.message;
                    }
                },
            );
    }
    /**
     * This function will validate and skip based on the boolean flags which determine whether to show selection options or not
     */
    validateSkipConstraint(): void {
        if (this.displayWritingNumber || this.displayGroupLocations || this.displayDeductionFrequency) {
            return;
        }
        this.skipStep();
    }
    /**
     * Function will return value to be pre populated based on step id and selectionType
     * @param stepId of the response to be pre populated
     * @param selectionType of the response to be pre populated
     * @returns value to be pre populated
     */
    getValueToBePrePopulated(stepId: number, selectionType: SelectionTypes): string {
        let response: ResponsePanel;
        if (this.planResponse) {
            response = this.planResponse.response.find((resp) => resp.stepId === stepId);
        }
        let valueToReturn: string = null;
        if (response && response.value.length > 0) {
            const value = response.value[0] as AgAppResponse;
            switch (selectionType) {
                case SelectionTypes.WRITING_NUMBER: {
                    valueToReturn = value.writingNumber || null;
                    break;
                }
                case SelectionTypes.GROUP_LOCATION: {
                    valueToReturn = value.aflacGroupLocation || null;
                    break;
                }
                case SelectionTypes.DEDUCTION_FREQUENCY: {
                    valueToReturn = value.deductionFrequency || null;
                    break;
                }
            }
        }
        return valueToReturn;
    }
    /**
     * This function will set planResponse array with data from store
     */
    setPlanResponse(): void {
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        this.planResponse = appResponse.find((resp) => resp.planId === this.planObject.application.planId);
    }
    /**
     * This function will complete the unsubscribe subject
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
