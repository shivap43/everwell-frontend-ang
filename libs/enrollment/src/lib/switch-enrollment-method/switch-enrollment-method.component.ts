import { Component, OnInit, Inject, Output, OnDestroy, EventEmitter, AfterContentInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, FormBuilder } from "@angular/forms";
import { Observable, forkJoin, Subscription, of, Subject } from "rxjs";
import {
    LanguageModel,
    StaticService,
    ProducerService,
    BenefitsOfferingService,
    CrossBorderRule,
    EAAResponse,
    AflacService,
    ProducerInformation,
} from "@empowered/api";
import { startWith, map, catchError, takeUntil } from "rxjs/operators";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { LanguageService, LanguageState } from "@empowered/language";

import {
    SetProductPlanData,
    SetErrorForShop,
    QuoteShopHelperService,
    AccountInfoState,
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    EnrollmentMethodModel,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { ApiError, EnrollmentMethod, CountryState, ProducerCredential } from "@empowered/constants";
import { AccountUtilService } from "@empowered/common-services";

interface Details {
    enrollmentType: string;
    enrollmentState: any;
    stateAbbreviation: any;
    route: ActivatedRoute;
    mpGroup: any;
    memberId: any;
}
@Component({
    selector: "empowered-switch-enrollment-method",
    templateUrl: "./switch-enrollment-method.component.html",
    styleUrls: ["./switch-enrollment-method.component.scss"],
})
export class SwitchEnrollmentMethodComponent implements OnInit, AfterContentInit, OnDestroy {
    @Output() sendEnrollmentState = new EventEmitter<any>();
    @Output() sendEnrollmentStateAbbr = new EventEmitter<any>();
    @Output() sendEnrollmentCity = new EventEmitter<string>();
    @ViewChild("stateinput", { static: true }) matStateInput;
    @ViewChild("cityinput") matCityInput;
    // TODO-Need to fix
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    filterState = new FormControl("");
    filterCity = new FormControl("");
    filteredStateOptions: Observable<string[]>;
    filteredCityOptions: Observable<string[]>;
    stateArray = [];
    defaultState: any;
    states: CountryState[] = [];
    switchEnrollmentForm: FormGroup;
    cities = ["Florida", "South Dakota", "Tennessee", "Michigan"];
    stateAbValue: string;
    selectedEnrollmentState: any;
    userType: string;
    isHeadset: boolean;
    enrollmentType: string;
    citiess: string[];
    citiesRes = false;
    temporaryState;
    headSetState: any;
    errorMsg: string;
    fieldErrorFlag = false;
    currentEnrollmentObj: EnrollmentMethodModel;
    headsetAPIValue = "HEADSET";
    userTypeGeneric = "generic";
    userTypeSpecific = "specific";
    situsStateNY = "New York";
    situsStateNYAbbr = "NY";
    headSetStateAbbreviation: any;
    stateToCompare: string[] = [];
    sendingEnrollmentState: any;
    tempStateName: any;
    isLoading;
    crossBorderRules: CrossBorderRule[] = [];
    subscriptions: Subscription[] = [];
    eaaResponse: EAAResponse;
    disableNext = false;
    allowCrossBorderCheck = false;
    tempState: CountryState;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.placeholderSelect",
        "primary.portal.common.close",
        "primary.portal.policyChangeRequest.transactions.removeRider.header",
        "primary.portal.shoppingExperience.switchParagraph",
        "primary.portal.shoppingExperience.headerSwitching",
        "primary.portal.accounts.state",
        "primary.portal.selectEnrollment.hintStateEnrollment",
        "primary.portal.common.selectionRequired",
        "primary.portal.accounts.city",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.situsState.nyenroll",
        "primary.portal.situsState.non-nyenroll",
        "primary.portal.quoteShop.plansDisplay.crossBorderRestriction",
        "primary.portal.enrollmentMethod.missingEAAWarning",
        "primary.portal.enrollmentMethod.number",
    ]);
    nyAcc: boolean;
    nonnyAcc: boolean;
    genericUserState: any;
    producerId: number;
    isDirect = false;
    isInvalidCity = false;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly switchEnrollmentDialogRef: MatDialogRef<SwitchEnrollmentMethodComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: Details,
        private readonly userService: UserService,
        private readonly producerService: ProducerService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly accountUtilService: AccountUtilService,
        private readonly aflacService: AflacService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }
    /**
     * @description method to initialize the component
     * @memberof SwitchEnrollmentMethodComponent
     */
    ngOnInit(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.producerId = credential.producerId;
        });
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.allowCrossBorderCheck = resp;
            });
        this.currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        this.temporaryState = this.data.stateAbbreviation;
        if (this.router.url.indexOf("direct") >= 0) {
            this.isDirect = true;
        }
        this.headSetState = this.currentEnrollmentObj.headSetState;
        this.headSetStateAbbreviation = this.currentEnrollmentObj.headSetStateAbbreviation;
        this.userType = this.currentEnrollmentObj.userType;
        if (this.isDirect) {
            this.defaultState = this.headSetStateAbbreviation;
        } else {
            this.defaultState = this.store.selectSnapshot(AccountInfoState).accountInfo.situs.state.abbreviation;
        }
        this.temporaryState = this.defaultState;
        this.enrollmentType = this.data.enrollmentType;
        this.switchEnrollmentForm = this.fb.group({
            state: this.filterState,
            city: this.filterCity,
            updateOn: "blur",
        });
        if (this.data.enrollmentType === this.headsetAPIValue) {
            this.isHeadset = true;
            this.switchEnrollmentForm.controls.city.clearValidators();
            this.switchEnrollmentForm.controls.city.updateValueAndValidity();
        } else {
            this.isHeadset = false;
        }
        forkJoin([
            this.producerService.getProducerInformation(this.producerId.toString()),
            this.benefitsOfferingService.getBenefitOfferingSettings(this.data.mpGroup),
            this.aflacService.getCrossBorderRules(this.data.mpGroup, this.data.memberId).pipe(catchError(() => of([]))),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([resp, offeredState, crossBorderRulesResp]) => {
                    const producerLicensedStates = resp.licenses.map((license) => license.state);
                    this.crossBorderRules = crossBorderRulesResp;
                    this.states = offeredState.states.filter((state) =>
                        producerLicensedStates.some((producerState) => state.abbreviation === producerState.abbreviation),
                    );
                    this.states.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
                    if (this.isDirect) {
                        // Direct Customers (No Group check required)
                        this.setStateDataForDirect(resp);
                    } else if (this.temporaryState !== this.situsStateNYAbbr) {
                        // Payroll Employee US Group
                        this.stateArray = this.states
                            .filter((state) => state.abbreviation !== this.situsStateNYAbbr)
                            .map((state) => state.name);
                        this.stateToCompare = this.states
                            .filter((state) => state.abbreviation !== this.situsStateNYAbbr)
                            .map((state) => state.abbreviation);
                    } else {
                        // Payroll Employee NY Group
                        this.stateArray.push(this.situsStateNY);
                        this.stateToCompare.push(this.situsStateNYAbbr);
                    }
                    this.filterState.setValue("");
                    if (!this.states.some((state) => state.abbreviation === this.defaultState)) {
                        this.switchEnrollmentForm.controls.state.setValue("");
                    } else {
                        this.switchEnrollmentForm.controls.state.setValue(this.defaultState);
                    }
                    if (this.defaultState === this.situsStateNYAbbr && this.headSetState !== this.situsStateNYAbbr) {
                        this.switchEnrollmentForm.controls.state.disable();
                    }
                    if (!this.headSetState && this.defaultState === this.situsStateNYAbbr) {
                        this.nyAcc = true;
                    }
                    if (!this.headSetState && this.defaultState !== this.situsStateNYAbbr) {
                        this.nonnyAcc = true;
                    }
                    if (this.allowCrossBorderCheck && this.enrollmentType === EnrollmentMethod.FACE_TO_FACE) {
                        this.eaaResponse = this.accountUtilService.checkCrossBorderRules(
                            this.switchEnrollmentForm.controls.state.value,
                            this.crossBorderRules,
                        );
                    }
                },
                (error) => this.setError(error.error),
            );
    }
    /**
     * method to set state data for direct customers
     * @param producerData - Data of the logged in producer
     */
    setStateDataForDirect(producerData: ProducerInformation): void {
        this.states = producerData.licenses.map((license) => license.state);
        this.stateArray = this.states.map((state) => state.name);
        this.stateToCompare = this.states.map((state) => state.abbreviation);
        if (this.temporaryState !== this.situsStateNYAbbr) {
            this.stateArray = this.states.filter((state) => state.abbreviation !== this.situsStateNYAbbr).map((state) => state.name);
            this.stateArray.sort();
            this.stateToCompare = this.states
                .filter((state) => state.abbreviation !== this.situsStateNYAbbr)
                .map((state) => state.abbreviation);
            this.stateToCompare.sort();
        }
    }
    /**
     * method to set error message to store
     * @param error - the API error response
     */
    setError(error: ApiError): void {
        if (error) {
            this.store.dispatch(new SetErrorForShop(error));
        }
    }
    /**
     * function to replace underscore from method name
     * @param method - the enrollment method selected
     */
    replaceUnderscore(method: string): string {
        if (method === EnrollmentMethod.HEADSET) {
            method = this.languageStrings["primary.portal.enrollmentMethod.Headset"];
        } else {
            method = method.replace(/_/g, "-");
        }
        return method;
    }
    /**
     * @description method to change the state and city dropdown values and handle cross border check
     * @param enrollmentState used to pass user selected state
     * @memberof SwitchEnrollmentMethodComponent
     */
    getStateOptionSelected(enrollmentState: string): void {
        this.selectedEnrollmentState = enrollmentState;
        this.switchEnrollmentForm.controls.state.setValue(this.selectedEnrollmentState);
        this.matStateInput.nativeElement.value = this.selectedEnrollmentState;
        if (this.switchEnrollmentForm.controls["city"].value.length) {
            this.switchEnrollmentForm.controls.city.setValue("");
        }
        this.getStateAbbr();
        this.disableAutoComplete();
        if (this.allowCrossBorderCheck && this.enrollmentType === EnrollmentMethod.FACE_TO_FACE) {
            this.eaaResponse = this.accountUtilService.checkCrossBorderRules(this.selectedEnrollmentState, this.crossBorderRules);
        }
    }
    getStateAbbr(): void {
        this.temporaryState = this.states
            .filter((item) => item.abbreviation === this.switchEnrollmentForm.controls["state"].value)
            .map((item) => item.abbreviation);
        if (this.temporaryState) {
            this.stateAbValue = this.temporaryState[0];
            this.getCity();
        }
    }
    /**
     * This method is used to clear city dropdown values when the user changes the state value.
     */
    removeCity(): void {
        this.eaaResponse.isMissingEAAError = false;
        this.eaaResponse.isMissingEAAWarning = false;
        const index = this.stateToCompare.indexOf(this.matStateInput.nativeElement.value);
        if (index === -1 && this.switchEnrollmentForm.controls["city"].value.length) {
            this.switchEnrollmentForm.controls.city.setValue("");
        }
        this.disableAutoComplete();
    }
    /**
     * This method is used to clear state dropdown text value when the user enters an invalid state.
     */
    removeStateText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            const index = this.stateToCompare.find((state) => state.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase());
            const typedValue = this.stateToCompare.find(
                (item) => item.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase(),
            );
            if (index && typedValue.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase()) {
                this.switchEnrollmentForm.controls["state"].setValue(typedValue);
                this.filterState.setValue(typedValue);
                this.getStateAbbr();
                this.getStateOptionSelected(typedValue);
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else {
                if (index === undefined || this.matStateInput.nativeElement.value !== this.switchEnrollmentForm.controls["state"].value) {
                    this.matStateInput.nativeElement.value = "";
                    this.switchEnrollmentForm.controls.state.setValue("");
                    this.filterState.setValue("");
                    this.matCityInput.nativeElement.value = "";
                    this.switchEnrollmentForm.controls.city.setValue("");
                    this.filterCity.setValue("");
                    this.disableAutoComplete();
                }
            }
        }, 250);
    }
    /**
     * @description function to get the selected city from dropdown
     * @param event selected city
     */
    getCityOptionSelected(event: string): void {
        this.isInvalidCity = false;
        this.switchEnrollmentForm.controls.city.setValue(event);
        this.matCityInput.nativeElement.value = event;
    }
    removeCityText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            const index = this.citiess.find((city) => city.toLocaleLowerCase() === this.matCityInput.nativeElement.value.toLowerCase());
            const typedValue = this.citiess.find(
                (item) => item.toLocaleLowerCase() === this.matCityInput.nativeElement.value.toLowerCase(),
            );
            if (index && typedValue.toLocaleLowerCase() === this.matCityInput.nativeElement.value.toLowerCase()) {
                this.switchEnrollmentForm.controls.city.setValue(typedValue);
                this.filterCity.setValue(typedValue);
                this.isInvalidCity = false;
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else {
                if (index === undefined || this.matCityInput.nativeElement.value !== this.switchEnrollmentForm.controls["city"].value) {
                    this.matCityInput.nativeElement.value = "";
                    this.switchEnrollmentForm.controls.city.setValue("");
                    this.filterCity.setValue("");
                }
            }
        }, 250);
    }
    private filteredState(value: string): string[] {
        if (this.stateToCompare) {
            const filterValue = value.toLowerCase();
            return this.stateToCompare.filter((option) => option.toLowerCase().indexOf(filterValue) === 0);
        }
        return [];
    }
    private filteredCity(value: string): string[] {
        if (this.citiesRes) {
            const filterValue = value.toLowerCase();
            return this.citiess.filter((option) => option.toLowerCase().indexOf(filterValue) === 0);
        }
        return [];
    }
    /**
     * closes the pop up with state data in response
     * @param stateData gets state data on close, that comes on click of apply
     */
    closePopup(stateData?: { state: CountryState; city: string }): void {
        this.switchEnrollmentDialogRef.close(stateData);
    }
    getCity(): void {
        this.staticService
            .getCities(this.temporaryState)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.citiess = res;
                    this.citiesRes = true;
                    this.filterCityMethod();
                },
                (error) => {},
            );
    }
    filterCityMethod(): void {
        this.filteredCityOptions = this.filterCity.valueChanges.pipe(
            startWith(""),
            map((value) => (value ? this.filteredCity(value) : this.citiess.slice())),
        );
    }
    quoteShop(): void {
        if (this.switchEnrollmentForm.invalid) {
            this.fieldErrorFlag = true;
        } else {
            this.fieldErrorFlag = false;
            if (
                this.matCityInput.nativeElement.value !== this.switchEnrollmentForm.controls["city"].value ||
                this.matStateInput.nativeElement.value !== this.switchEnrollmentForm.controls["state"].value
            ) {
                this.removeCityText();
                this.removeStateText();
            } else {
                this.setStateValue();
            }
        }
    }
    /**
     *
     * @description Dispatches latest data into the store after method change
     * @memberof SwitchEnrollmentMethodComponent
     */
    setStateValue(): void {
        this.closePopup();
        this.tempState = this.states.find((item) => item.abbreviation === this.switchEnrollmentForm.controls["state"].value);
        if (this.tempState) {
            this.sendingEnrollmentState = this.tempState.name;
            this.stateAbValue = this.tempState.abbreviation;
        }
        // Made changes to pass the state data on close
        this.closePopup({
            state: this.tempState,
            city: this.switchEnrollmentForm.controls.city.value,
        });
        this.sendEnrollmentState.emit(this.sendingEnrollmentState);
        this.sendEnrollmentStateAbbr.emit(this.stateAbValue);
        this.sendEnrollmentCity.emit(this.switchEnrollmentForm.controls["city"].value);
        let userType = this.userTypeSpecific;
        let memberId = this.data.memberId;
        if (this.userType === this.userTypeGeneric) {
            userType = this.userTypeGeneric;
            memberId = null;
        }

        this.store.dispatch(
            new SetEnrollmentMethodSpecific({
                enrollmentMethod: this.data.enrollmentType,
                enrollmentState: this.sendingEnrollmentState,
                headSetState: this.headSetState,
                headSetStateAbbreviation: this.headSetStateAbbreviation,
                enrollmentStateAbbreviation: this.stateAbValue,
                enrollmentCity: this.switchEnrollmentForm.controls["city"].value,
                userType: userType,
                memberId: memberId,
                mpGroup: this.data.mpGroup.toString(),
            }),
        );
        this.quoteShopHelperService.changeEnrollmentData({
            enrollmentStateAbbr: this.stateAbValue,
            enrollmentMethod: this.data.enrollmentType,
        });

        this.store
            .dispatch(
                new SetProductPlanData({
                    mpGroup: this.data.mpGroup,
                    selectedMethod: this.data.enrollmentType,
                    selectedState: this.stateAbValue,
                    memberId: memberId,
                    stateOrMethodChange: true,
                }),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((x) => {
                this.isLoading = false;
            });
    }
    disableAutoComplete(): void {
        const typedValue = this.stateToCompare.find((item) => item === this.matStateInput.nativeElement.value);
        if (typedValue === this.matStateInput.nativeElement.value) {
            this.switchEnrollmentForm.controls["state"].setValue(typedValue);
            this.filterState.setValue(typedValue);
        }
        if (this.switchEnrollmentForm.controls["state"].value && this.switchEnrollmentForm.controls["state"].value.length > 0) {
            this.switchEnrollmentForm.controls["city"].enable();
        } else {
            this.switchEnrollmentForm.controls["city"].disable();
        }
    }
    /**
     * @description To capture the valid city typed by user
     */
    captureTypedCity(): void {
        const typedValue = this.citiess.find((item) => item === this.matCityInput.nativeElement.value);
        this.isInvalidCity = !typedValue;
        if (typedValue === this.matCityInput.nativeElement.value) {
            this.switchEnrollmentForm.controls.city.setValue(typedValue);
            this.filterCity.setValue(typedValue);
        }
    }
    ngAfterContentInit(): void {
        this.getCity();
        this.citiess = [];
        this.filteredStateOptions = this.filterState.valueChanges.pipe(
            startWith(""),
            map((value) => (value ? this.filteredState(value) : this.stateToCompare.slice())),
        );
        this.filterCityMethod();
    }
    /**
     * Method used to unsubscribe and handle garbage collection
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
