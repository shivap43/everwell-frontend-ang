import {
    BenefitsOfferingService,
    StaticService,
    ProducerService,
    RecentCensusConflict,
    AuthenticationService,
    AccountService,
    ThirdPartyPlatformRequirement,
    BenefitOfferingSettingsInfo,
    AflacService,
} from "@empowered/api";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { Store } from "@ngxs/store";
import { Subject, Observable, forkJoin, of, combineLatest } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { takeUntil, startWith, map, switchMap, filter, tap } from "rxjs/operators";
import { UpdateArgusEmployeeCountComponent } from "@empowered/ui";

import {
    BenefitsOfferingState,
    SetAllEligiblePlans,
    GetProductsPanel,
    DiscardPlanChoice,
    SetPlanChoices,
    SetPlanEligibility,
    UpdateBenefitsOfferingState,
    SetEligibleEmployees,
    SetThirdPartyPlatformRequirement,
    SideNavService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { Router, ActivatedRoute } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { HttpErrorResponse } from "@angular/common/http";
import {
    ArgusConfig,
    ServerErrorResponseCode,
    ModalDialogAction,
    AccountImportTypes,
    ArgusEligibleEmployeeData,
    CompanyCode,
    AppSettings,
    CountryState,
    Accounts,
    Account,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { AccountsActions } from "@empowered/ngrx-store/ngrx-states/accounts";
import { getSelectedAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";

const ELIGIBLE_EMPLOYEE_COUNT = 250;
const COMPANY_CODE_ATTRIBUTE = "company_code";
const ERROR = "error";

@Component({
    selector: "empowered-settings",
    templateUrl: "./settings.component.html",
    styleUrls: ["./settings.component.scss"],
})
export class SettingsComponent implements OnInit, OnDestroy {
    @ViewChild("censusTemplate", { static: true }) censusModal;
    @ViewChild("licensedTemplate", { static: true }) lincensedModal;
    @ViewChild("input", { static: true }) matInput;
    form: FormGroup;
    defaultState: CountryState[];
    minEmployeeConfig = "broker.plan_year_setup.self_service_enrollment.census_upload_minimum_employee";
    benefitOfferingStates: CountryState[];
    censusEstimate: number;
    argusTotalEligibleEmployees: number;
    allState: CountryState[];
    licensedStates: CountryState[];
    isChecked = false;
    statesList: string[] = [];
    addStates: string[];
    removeStates: string[];
    notLicensedStates: string[];
    saveError = false;
    errorMessage: string;
    minEligibleEmpMsg: string;
    minEligibleADVEmpMsg: string;
    filteredState: Observable<CountryState[]>;
    lastFilter: string;
    showSpinner = true;
    mpGroup: number;
    minEmployees = false;
    minArgusEmployeesCheck = false;
    censusData: RecentCensusConflict;
    previousState: string[];
    previousEmployees: number;
    unsubscribe$ = new Subject<void>();
    hasCensusUploadPermission: boolean;
    isRefreshInProgress = false;
    disableEditLink: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.setting.title",
        "primary.portal.benefitsOffering.setting.censusModal.title",
        "primary.portal.benefitsOffering.setting.licensedModal.title",
        "primary.portal.benefitsOffering.setting.firstQuery",
        "primary.portal.benefitsOffering.setting.secondQuery",
        "primary.portal.benefitsOffering.setting.censusModal.dontUpdate",
        "primary.portal.benefitsOffering.setting.censusModal.update",
        "primary.portal.benefitsOffering.setting.censusAnchor",
        "primary.portal.benefitsOffering.setting.co-enrollersAnchor",
        "primary.portal.benefitsOffering.setting.licensedModal.gotIt",
        "primary.portal.common.close",
        "primary.portal.benefitsOffering.selfServiceEnrollment",
        "primary.portal.common.back",
        "primary.portal.common.next",
        "primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment",
        "primary.portal.benefitOffering.settings.enrollmentThirdPartyPlatform",
        "primary.portal.benefitOffering.settings.enrollmentThirdPartyPlatformAnswer",
        "primary.portal.benefitOffering.settings.enrollmentThirdPartyPlatformYes",
        "primary.portal.benefitOffering.settings.futureThirdPartyPlatform",
        "primary.portal.benefitOffering.settings.thirdPartyPlatformAccountProfile",
        "primary.portal.benefitsOffering.aflac.ADVEnrollment",
        "primary.portal.benefitsOffering.setting.invalidZipCode",
        "primary.portal.sidenav.settings",
        "primary.portal.benefitsOffering.filterStates",
    ]);
    account: Accounts;
    isSitusNY: boolean;
    eligibleEmployeeCount: number;
    eligibleADVMinEmployeeCount: number;
    eligibleADVMaxEmployeeCount: number;
    NEW_YORK = "NY";
    isAccountDeactivated: boolean;
    hasThirdPartyPlatforms$: Observable<boolean> = this.benefitsOfferingHelperService.fetchAccountTPPStatus();
    tppRequirement: ThirdPartyPlatformRequirement;
    isSuccess: boolean;
    isServerError: boolean;
    isAccountRefreshFailure: boolean;
    validZip = true;
    account$: Observable<Account>;
    companyCode: string;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly sideNavService: SideNavService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly staticService: StaticService,
        private readonly producerService: ProducerService,
        private readonly matDialog: MatDialog,
        private readonly authenticationService: AuthenticationService,
        private readonly route: Router,
        private readonly language: LanguageService,
        private readonly router: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly aflacService: AflacService,
        private readonly utilService: UtilService,
        private readonly ngrxStore: NGRXStore,
    ) {}
    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: this.mpGroup }));
        this.account$ = this.ngrxStore.onAsyncValue(select(getSelectedAccount));
        this.account$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.companyCode = resp.companyCode;
        });
        this.hasCensusUploadPermission = false;
        this.form = this.formBuilder.group({
            stateControl: [null],
            eligibleEmp: [null, [Validators.required, this.validateNumber.bind(this), Validators.min(1)]],
            eligibleADVEmp: [{ value: "", disabled: true }, [Validators.required, this.validateNumber.bind(this), Validators.min(1)]],
            isThirdPartyPlatformRequired: [false],
        });
        this.authenticationService.permissions$.subscribe((response) => {
            if (response.find((d) => String(d) === "core.census.upload")) {
                this.hasCensusUploadPermission = true;
            }
        });
        this.staticUtilService
            .cacheConfigValue(this.minEmployeeConfig)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => (this.eligibleEmployeeCount = Number(value)));

        combineLatest([
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MIN_VALUE),
            this.staticUtilService.cacheConfigValue(ArgusConfig.ELIGIBLE_EMPLOYEES_MAX_VALUE),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([argusMinValue, argusMaxValue]) => {
                this.eligibleADVMinEmployeeCount = Number(argusMinValue);
                this.eligibleADVMaxEmployeeCount = Number(argusMaxValue);
            });

        if (this.mpGroup) {
            this.serviceCalls();
            this.sideNavService.stepClicked$.next(0);
        }
        this.fetchAccountStatus();
        this.getThirdPartyPlatformRequirements();
    }
    /**
     * This method is used to fetch third party platform requirements
     */
    getThirdPartyPlatformRequirements(): void {
        this.benefitsOfferingHelperService
            .getThirdPartyPlatformRequirements()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((tppRequirement: ThirdPartyPlatformRequirement) => {
                    this.tppRequirement = tppRequirement;
                    this.form.controls.isThirdPartyPlatformRequired.patchValue(this.tppRequirement.thirdPartyPlatformRequired);
                }),
            )
            .subscribe();
    }
    /**
     * This method will make several API calls to get required data
     */
    serviceCalls(): void {
        const licensedState = this.producerService.getAllProducersLicensedStates(this.mpGroup);
        const defaultState = this.benefitsOfferingService.getBenefitOfferingDefaultStates(this.mpGroup);
        const allState = this.staticService.getStates();
        const benefitOfferingSettingsDetails = this.benefitsOfferingService.getBenefitOfferingSettings(this.mpGroup);
        const accountDetails = this.accountService.getAccount(this.mpGroup.toString());
        forkJoin([licensedState, defaultState, allState, benefitOfferingSettingsDetails, accountDetails])
            .pipe(
                tap(
                    ([licensedStates, defaultStates, allStates, settingsDetails, accountInfo]: [
                        CountryState[],
                        CountryState[],
                        CountryState[],
                        BenefitOfferingSettingsInfo,
                        Accounts,
                    ]) => {
                        this.allState = allStates;
                        this.benefitOfferingStates = settingsDetails.states;
                        this.licensedStates = licensedStates;
                        this.defaultState = defaultStates;
                        this.benefitsOfferingService.setBenefitOfferingSitusState(this.defaultState);
                        this.censusEstimate = settingsDetails.totalEligibleEmployees;
                        this.argusTotalEligibleEmployees = settingsDetails.argusTotalEligibleEmployees;
                        this.account = accountInfo;
                    },
                ),
                switchMap((res) => this.utilService.validateZip(this.account.situs.state.abbreviation, this.account.situs.zip)),
                tap((resp) => {
                    this.validZip = resp;
                }),
            )
            .subscribe(
                (attribute) => {
                    this.prePopulateStates();
                    this.prePopulateCensus();
                    this.updateFilteredState();
                    this.showSpinner = false;
                    this.updateValues();
                    this.fetchCensusConflict();
                    /* checking for NY account for dropdown states*/
                    if (this.account && this.account.situs && this.account.situs.state && this.account.situs.state.abbreviation) {
                        this.allState = this.allState.filter(
                            (state) =>
                                (this.companyCode === CompanyCode.NY && state.abbreviation === this.NEW_YORK) ||
                                (this.companyCode === CompanyCode.US && state.abbreviation !== this.NEW_YORK),
                        );
                        this.isSitusNY =
                            (this.account.situs.state.abbreviation === this.NEW_YORK && this.companyCode !== CompanyCode.US) ||
                            (this.account.situs.state.abbreviation !== this.NEW_YORK && this.companyCode === CompanyCode.NY);
                    }
                },
                (error) => {
                    this.displayDefaultError(error);
                },
            );
    }
    /**
     * function to update variables from store data
     */
    updateValues(): void {
        const states: CountryState[] = this.benefitOfferingStates.length ? this.benefitOfferingStates : this.defaultState;
        this.previousState = states.map((state) => state.name);
        this.previousEmployees = this.censusEstimate;
        this.employeeCountChanged(this.censusEstimate);
        this.employeeADVCountChanged(this.argusTotalEligibleEmployees);
    }
    // This method will fetch if any census conflict is there or not.
    fetchCensusConflict(): void {
        this.benefitsOfferingService
            .getRecentCensusConflict(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.censusData = response;
                if (response) {
                    this.checkCensusData();
                }
            });
    }
    /**
     * This method determines whether to hide or show the minimum employee requirement in the settings page
     * @param employeeCount : contains current value of the input field
     */
    employeeCountChanged(employeeCount: number): void {
        this.minEligibleEmpMsg = this.languageStrings["primary.portal.benefitsOffering.nonTpi.selfServiceEnrollment"].replace(
            "##empCount##",
            String(this.eligibleEmployeeCount),
        );
        this.minEmployees = !(employeeCount >= this.eligibleEmployeeCount);
    }
    /**
     * This method is used to display employee eligiblity message for ADV plans in the settings page
     * @param employeeCount : contains current value of the input field
     */
    employeeADVCountChanged(employeeCount: number): void {
        this.minEligibleADVEmpMsg = this.languageStrings["primary.portal.benefitsOffering.aflac.ADVEnrollment"]
            .replace("##empMinCount##", String(this.eligibleADVMinEmployeeCount))
            .replace("##empMaxCount##", String(this.eligibleADVMaxEmployeeCount));
        this.minArgusEmployeesCheck = !(
            employeeCount >= this.eligibleADVMinEmployeeCount && employeeCount <= this.eligibleADVMaxEmployeeCount
        );
    }
    /**
     * function to open dialog for update argus employee count
     */
    openArgusDialogOnEdit(): void {
        const dialogData: ArgusEligibleEmployeeData = {
            eligibleADVMinEmployeeCount: this.eligibleADVMinEmployeeCount,
            eligibleADVMaxEmployeeCount: this.eligibleADVMaxEmployeeCount,
            employeeCount: this.argusTotalEligibleEmployees,
            mpGroup: this.mpGroup,
        };

        this.empoweredModal
            .openDialog(UpdateArgusEmployeeCountComponent, {
                data: dialogData,
            })
            .afterClosed()
            .pipe(
                tap((employeeCountResp) => {
                    if (employeeCountResp && employeeCountResp.action === ModalDialogAction.SAVED) {
                        this.isRefreshInProgress = employeeCountResp.isRefresh;
                        this.isSuccess = false;
                        this.isServerError = false;
                        this.isAccountRefreshFailure = false;
                        this.disableEditLink = true;
                        this.argusTotalEligibleEmployees = +employeeCountResp.eligibleADVEmp;
                        this.form.controls.eligibleADVEmp.setValue(employeeCountResp.eligibleADVEmp);
                        this.employeeADVCountChanged(employeeCountResp.eligibleADVEmp);
                    } else {
                        this.disableEditLink = false;
                    }
                }),
                filter((result) => result && result.action === ModalDialogAction.SAVED),
                // override the refresh account behavior upon updating argus eligible employee count
                switchMap(() => this.aflacService.refreshAccount(this.mpGroup.toString(), true)),
            )
            .subscribe(
                () => {
                    this.isRefreshInProgress = false;
                    this.isSuccess = true;
                    this.disableEditLink = false;
                },
                (error) => {
                    this.isRefreshInProgress = false;
                    this.disableEditLink = false;
                    if (error) {
                        this.accountRefreshErrorAlertMessage(error);
                    }
                },
            );
    }

    /**
     * function to show error message for account refresh
     */
    accountRefreshErrorAlertMessage(err: Error): void {
        if (err[ERROR] && err[ERROR].status === ServerErrorResponseCode.RESP_503) {
            this.isServerError = true;
        } else {
            this.isAccountRefreshFailure = true;
        }
    }
    /**
     * This method will get selected state in dropdown.
     */
    updateFilteredState(): void {
        this.filteredState = this.form.controls.stateControl.valueChanges.pipe(
            startWith<string | CountryState[]>(""),
            map((value) => (typeof value === "string" ? value : this.lastFilter)),
            map((filterVal) => this.filter(filterVal)),
        );
    }
    /**
     * This method will return the searched state.
     * @param data of string
     * @returns list of filtered states
     */
    filter(data: string): CountryState[] {
        this.lastFilter = data;
        let filteredStates;
        if (data) {
            filteredStates = this.allState.filter((option) => option.name.toLowerCase().indexOf(data.toLowerCase()) === 0);
        } else {
            filteredStates = this.allState.slice();
        }
        return filteredStates;
    }
    // This method will prepopulate states in state field.
    prePopulateStates(): void {
        const isDefaultStateExist = this.benefitOfferingStates.some((states) =>
            this.defaultState.some((defaultStateName) => defaultStateName.abbreviation === states.abbreviation),
        );

        const stateName = isDefaultStateExist
            ? this.benefitOfferingStates.map((states) => states.name)
            : this.defaultState.map((states) => states.name);
        this.updateStateList(stateName);
    }
    // This method will prepopulate eligible employees in eligible employee field.
    prePopulateCensus(): void {
        this.form.controls.eligibleEmp.setValue(this.censusEstimate);
        this.form.controls.eligibleADVEmp.setValue(this.argusTotalEligibleEmployees);
    }
    // This method will check the validation for eligible employees.
    validateNumber(contol: FormControl): any {
        const value = contol.value;
        const numberCheck = /^[0-9]*$/;
        return !numberCheck.test(value) && value ? { requirements: true } : null;
    }
    // This method will give the changed census data for census modal.
    checkCensusData(): void {
        const selectedStatesArray: CountryState[] = this.benefitOfferingStates.length ? this.benefitOfferingStates : this.defaultState;
        const selectedState: string[] = selectedStatesArray.map((state) => state.abbreviation);
        const savedCount = this.censusEstimate;
        const censusState = this.censusData.states;
        const censusCount = this.censusData.count;
        this.addStates = censusState.filter((state) => !(selectedState.indexOf(state) >= 0));
        this.removeStates = selectedState.filter((state) => !(censusState.indexOf(state) >= 0));
        this.addStates = this.allState.filter((state) => this.addStates.indexOf(state.abbreviation) >= 0).map((state) => state.name);
        this.removeStates = this.allState.filter((state) => this.removeStates.indexOf(state.abbreviation) >= 0).map((state) => state.name);
        if (this.addStates.length || this.removeStates.length || savedCount !== censusCount) {
            this.openModal();
        }
    }
    // This method will update the selected state list.
    updateStateList(stateName: string[]): void {
        this.statesList = [...stateName];
        this.isChecked = this.statesList.length === this.allState.length;
    }
    isStateSelected(state: string): boolean {
        return this.statesList.indexOf(state) >= 0 ? true : false;
    }
    // This method will open the census modal.
    openModal(): void {
        this.matDialog.open(this.censusModal);
    }
    // This method will close the modal.
    closeModal(): void {
        this.matDialog.closeAll();
    }
    // This method will select or deselect all the states.
    selectAll(): void {
        this.isChecked = !this.isChecked;
        if (this.isChecked) {
            const stateName = this.allState.map((states) => states.name);
            this.statesList = [...stateName];
        } else {
            this.statesList = this.defaultState.map((state) => state.name);
        }
        if (!this.form.controls.stateControl.value) {
            this.form.controls.stateControl.reset();
        }
    }
    // This method is used to add or remove state.
    addRemoveState(stateName: string): void {
        this.form.controls.stateControl.setValue("");
        const index = this.statesList.indexOf(stateName);
        if (index >= 0) {
            if (!this.isSitusState(stateName)) {
                this.isChecked = false;
                this.statesList.splice(index, 1);
            }
        } else {
            this.statesList.push(stateName);
        }

        if (this.statesList.length === this.allState.length) {
            this.isChecked = true;
        }
        if (!this.form.controls.stateControl.value) {
            this.form.controls.stateControl.reset();
        }
    }
    removeText(): void {
        /* setTimeout is required to remove the data typed when clicked outside input field and
             since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            this.matInput.nativeElement.value = "";
            this.form.controls.stateControl.setValue("");
        }, 250);
    }
    /**
     * This method will update the states with census data
     */
    updateStates(): void {
        let stateName = this.censusData.states;
        stateName = this.allState.filter((state) => stateName.indexOf(state.abbreviation) >= 0).map((state) => state.name);
        this.updateStateList(stateName);
        this.form.controls.eligibleEmp.setValue(this.censusData.count);
        this.form.controls.eligibleADVEmp.setValue(this.argusTotalEligibleEmployees);
        this.matDialog.closeAll();
    }
    getSelectedState(): CountryState[] {
        const selectedState = this.allState.filter((state) => this.statesList.indexOf(state.name) >= 0);
        return selectedState;
    }
    removeAllStates(): void {
        if (this.statesList.length === this.allState.length) {
            this.isChecked = false;
        }
        this.statesList = this.defaultState.map((state) => state.name);
        this.removeText();
    }
    /**
     * This method is for checking the form is valid or not
     */
    onNext(): void {
        this.isLicensed();
        if (!this.statesList.length) {
            this.form.controls.stateControl.setErrors({ requirement: true });
        } else {
            this.form.controls.stateControl.reset();
        }
        if (this.form.valid) {
            if (this.notLicensedStates.length) {
                this.matDialog.open(this.lincensedModal);
            } else {
                this.nextStep();
            }
        }
        this.createApprovalRequest();
    }
    // This method will get the states which has no licensed producer.
    isLicensed(): void {
        const licensedState = this.licensedStates.map((states) => states.name);
        this.notLicensedStates = this.statesList.filter((states) => !(licensedState.indexOf(states) >= 0));
    }

    createApprovalRequest(): void {
        this.benefitsOfferingService
            .getApprovalRequests(this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((result) => result.length === 0),
                switchMap((result) => this.benefitsOfferingService.createApprovalRequest(this.mpGroup)),
            )
            .subscribe();
    }
    // This method will return state error message.
    getErrorState(): string {
        return "secondary.portal.benefitsOffering.setting.statesRequired";
    }
    // This method will return eligible employeed error message.
    getEmployeeError(): string {
        return this.form.get("eligibleEmp").hasError("required")
            ? "secondary.portal.benefitsOffering.setting.employeesRequired"
            : this.form.get("eligibleEmp").hasError("requirements")
            ? "secondary.portal.benefitsOffering.setting.alphaError"
            : this.form.get("eligibleEmp").hasError("min")
            ? "secondary.portal.benefitsOffering.setting.minError"
            : "";
    }
    /**
     * This method will execute on click of next and if form is valid
     * This method is used to save data and load data to store
     * This method will redirect to products panel
     */
    nextStep(): void {
        this.matDialog.closeAll();
        this.showSpinner = true;
        const census = this.form.controls.eligibleEmp.value;
        const updateStoreState = this.getSelectedState();
        const stateAbbreviation = updateStoreState.map((state) => state.abbreviation);
        this.statesList.sort();
        this.previousState.sort();
        const updatedSettingsInfo: BenefitOfferingSettingsInfo = {
            thirdPartyPlatformRequired: this.form.controls.isThirdPartyPlatformRequired.value,
            totalEligibleEmployees: census,
            stateAbbreviations: stateAbbreviation,
        };
        this.store.dispatch(new SetEligibleEmployees(census));
        this.benefitsOfferingService
            .saveBenefitOfferingSettings(updatedSettingsInfo, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => {
                    if (census !== this.censusEstimate || JSON.stringify(this.statesList) !== JSON.stringify(this.previousState)) {
                        return this.store.dispatch(new DiscardPlanChoice());
                    }
                    return of(null);
                }),
                tap((res) => {
                    this.store.dispatch(new UpdateBenefitsOfferingState(updateStoreState));
                    this.store.dispatch(new SetThirdPartyPlatformRequirement());
                }),
                switchMap((res) => this.store.dispatch(new SetAllEligiblePlans(stateAbbreviation, AccountImportTypes.AFLAC_INDIVIDUAL))),
                switchMap((res) => this.store.dispatch(new SetPlanEligibility())),
                switchMap((res) => this.store.dispatch(new SetPlanChoices(true))),
                switchMap((res) => this.store.dispatch(new GetProductsPanel())),
            )
            .subscribe(
                (resp) => {
                    this.sideNavService.defaultStepPositionChanged$.next(2);
                },
                (error) => {
                    if (error.status === AppSettings.API_RESP_400) {
                        this.showSpinner = false;
                        this.saveError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.benefitsOffering.setting.employeesError",
                        );
                    } else {
                        this.displayDefaultError(error);
                    }
                },
            );
    }
    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.showSpinner = false;
        this.saveError = true;
        this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
    }
    // This method will navigate to Census
    navigateCensus(): void {
        this.route.navigate(["../../../employees"], { relativeTo: this.router });
    }

    navigateCommission(): void {
        this.route.navigate(["../../../commissions"], { relativeTo: this.router });
    }
    // This method is used to check the account status
    fetchAccountStatus(): void {
        this.isAccountDeactivated = this.sideNavService.fetchAccountStatus();
    }
    // This method will unsubscribe all the api subscription.
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    isSitusState(stateName: string): boolean {
        const index = this.benefitsOfferingService.getBenefitOfferingSitusState().findIndex((state) => state.name === stateName);
        let returnValue = false;
        if (index > -1) {
            returnValue = true;
        }
        return returnValue;
    }
    /**
     * This method is used to navigate user to enrollment-options screen where user can add third party platform
     */
    navigateToAddThirdParty(): void {
        this.route.navigate(["../../../enrollment-options"], { relativeTo: this.router });
    }
}
