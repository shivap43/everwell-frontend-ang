import {
    EnrollmentState,
    UpdateConstraintValues,
    UpdateCartData,
    AccountInfoState,
    DualPlanYearState,
    SharedState,
    AppFlowService,
    StaticUtilService,
} from "@empowered/ngxs-store";

import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import {
    MemberService,
    ShoppingCartDisplayService,
    StaticService,
    CoreService,
    AccountService,
    ShoppingService,
    CartStatus,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { forkJoin, Subject, Observable, EMPTY, combineLatest, iif, of, defer } from "rxjs";
import { Router, ActivatedRoute } from "@angular/router";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { TpiAddDependentsComponent } from "../tpi-add-dependents/tpi-add-dependents.component";
import { tap, switchMap, catchError, filter, map, finalize, first, takeUntil } from "rxjs/operators";

import {
    CarrierId,
    PortalType,
    Permission,
    ResponsePanel,
    ResponseItem,
    StepData,
    AllConstraint,
    TpiSSOModel,
    AppSettings,
    DualPlanYearSettings,
    Portals,
    Address,
    RatingCode,
    Configurations,
    AddCartItem,
    Step,
    TaxStatus,
    CoverageLevelRule,
    CoverageLevel,
    GetCartItems,
    ApplicationResponse,
    PlanOfferingPricing,
    Relations,
    MemberDependent,
    MemberQualifyingEvent,
    StepType,
    RewriteConfigName,
} from "@empowered/constants";
import { CompleteRequiredDependentInfoComponent } from "./complete-required-dependent-info/complete-required-dependent-info.component";
import { TPIRestrictionsForHQAccountsService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const MILLISECONDS_IN_DAY = 86400000;
const DAYS_IN_YEAR = 365.25;
const REQUIRED_ADDRESS_FIELDS = ["address1", "state", "city", "zip"];
interface DependentData {
    value: number;
    viewValue: ViewValue;
    relationId: number;
    dependentAgeInDays: number;
    dependentAgeInYears: number;
}

interface ViewValue {
    firstName: string;
    lastName: string;
}

@Component({
    selector: "empowered-dependents",
    templateUrl: "./dependents.component.html",
    styleUrls: ["./dependents.component.scss"],
})
export class DependentsComponent implements OnInit, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    @Input() riderIndex: number;
    @Input() tpiSSODetails: TpiSSOModel;
    mpGroup: number;
    memberId: number;
    dependents: MemberDependent[] = [];
    dependentsToDisplay: DependentData[] = [];
    dependentRelations: Relations[];
    dependentsForm: FormGroup;
    stepDetails: Step[];
    fieldErrorflag = false;
    appResponse: ResponseItem;
    private unsubscribe$ = new Subject<void>();
    stepType;
    vspDependentsToDisplay = [];
    selectedVspDependents = [];
    stepTypeEnum = StepType;
    taxOptions;
    vspDependentfieldErrorflag = false;
    taxStatus;
    coverageLevels;
    coverageRules = [];
    planOfferingPrices: PlanOfferingPricing[] = [];
    errorMessage;
    hasError = false;
    showSpinner = false;
    minDependentAgeInDays: number;
    maxDependentAgeInYears: number;
    canAccessAflacHQAc = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.requiredField",
        "primary.portal.common.next",
        "primary.portal.common.addDependent",
        "primary.portal.applicationFlow.dependents.next",
        "primary.portal.applicationFlow.pretaxOption",
        "primary.portal.applicationFlow.posttaxOption",
        "primary.portal.common.requiredField",
        "primary.portal.applicationFlow.planOption.preTax",
        "primary.portal.applicationFlow.dependant",
    ]);
    secondaryLanguageString: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.dependentMinAge",
        "secondary.portal.applicationFlow.dependentMaxAge",
    ]);
    queryString = [
        "input.ng-invalid",
        "mat-radio-group.ng-invalid > mat-radio-button",
        "textarea.ng-invalid, mat-select.ng-invalid",
        "mat-selection-list.ng-invalid > mat-list-option",
    ].join(",");
    currentQleId: number;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    tpiAssistingAdminId: number;
    dependentAge: number;
    taxStatusReadOnly: boolean;
    isOpenEnrollment: boolean;
    isQLEPeriod: boolean;
    @Select(EnrollmentState.GetIsOpenEnrollment) isOpenEnrollment$: Observable<boolean>;
    @Select(EnrollmentState.GetIsQLEPeriod) isQLEPeriod$: Observable<boolean>;

    constructor(
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly appFlowService: AppFlowService,
        private readonly staticService: StaticService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly shoppingService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly empoweredService: EmpoweredModalService,
        private readonly sheetService: EmpoweredSheetService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly staticUtilService: StaticUtilService,
        private readonly dateService: DateService,
    ) {
        this.isOpenEnrollment$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => (this.isOpenEnrollment = resp));
        this.isQLEPeriod$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => (this.isQLEPeriod = resp));
    }

    /**
     * Fetches required data and initializes variables
     * used to call @method getStepDetails
     * used to call @method getDataFromStore
     * used to subscribe @method getDependents
     * used to call @method getCoverageLevels
     * used to call @method getPlanOfferingDetails
     * used to call @method getPlanPricing
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        this.showSpinner = true;
        this.tpiAssistingAdminId = this.appFlowService.getTpiAssistingAdminId();
        this.getStepDetails();
        this.getPlanOfferingDetails();
        this.stepType =
            this.planObject.currentSection.steps && this.planObject.currentSection.steps.length > 0
                ? this.planObject.currentSection.steps[0].step[0].type
                : "";
        this.getDataFromStore();
        this.getDependents().pipe(takeUntil(this.unsubscribe$)).subscribe();
        this.canAddDependents();
        this.getCoverageLevels();
        this.getPlanPricing();
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQleId = qle ? qle.id : null));
        }
        this.dependentsForm =
            this.stepType === StepType.DEPENDENTSKAISER
                ? this.fb.group({
                      dependentSelection: ["", Validators.required],
                  })
                : null;
    }
    getDataFromStore(): void {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.appResponse = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter(
                (resp) =>
                    resp.application.planId === this.planObject.application.planId &&
                    resp.application.cartItemId === this.planObject.application.cartData.id,
            )
            .pop();
    }
    /**
     * check if user can add dependents in app flow
     */
    canAddDependents(): void {
        const portal = this.store.selectSnapshot(SharedState.portal);
        if (portal === PortalType.PRODUCER) {
            this.tpiRestrictions
                .canAccessTPIRestrictedModuleInHQAccount(Permission.DEPENDENTS_READONLY, null, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.canAccessAflacHQAc = res;
                });
        }
        if (portal === PortalType.MEMBER) {
            combineLatest([
                this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(),
                this.staticUtilService.cacheConfigEnabled(Permission.AFLAC_HQ_MEMBER_PROFILE_EDIT_CONFIG),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([isNotHQAccount, response]) => {
                    this.canAccessAflacHQAc = isNotHQAccount || response;
                });
        }
    }
    /**
     * This method is used to gather all the dependent related information
     * @returns Observable of Relations[], MemberDependent[], Configurations[], Configurations[]
     */
    getDependents(): Observable<[Relations[], MemberDependent[], Configurations[]]> {
        return forkJoin([
            this.accountService.getDependentRelations(this.mpGroup),
            this.memberService.getMemberDependents(this.memberId, true, this.mpGroup),
            this.staticUtilService.fetchConfigs(
                [RewriteConfigName.CHILD_MIN_AGE_IN_DAYS, RewriteConfigName.CHILD_MAX_AGE_IN_YEARS],
                this.mpGroup,
            ),
        ]).pipe(
            takeUntil(this.unsubscribe$),
            tap((response) => {
                this.dependentRelations = response[0];
                this.dependents = response[1];
                this.minDependentAgeInDays = +response[2]
                    .find((config) => config.name === RewriteConfigName.CHILD_MIN_AGE_IN_DAYS)
                    .value.split(",")[0];
                this.maxDependentAgeInYears = +response[2]
                    .find((config) => config.name === RewriteConfigName.CHILD_MAX_AGE_IN_YEARS)
                    .value.split(",")[0];
                this.dependentsToDisplay = [];
                this.vspDependentsToDisplay = [];
                if (this.stepType === StepType.DEPENDENTSKAISER) {
                    this.createJuvenileFormFields();
                } else if (this.stepType === StepType.DEPENDENTS) {
                    this.createVspFormFields();
                }
            }),
            catchError((error) => {
                this.showSpinner = false;
                return EMPTY;
            }),
        );
    }
    /**
     * Below method will be used for dependents implementation for juvenile product
     */
    createJuvenileFormFields(): void {
        if (this.dependents.length > 0) {
            const filteredDependents: MemberDependent[] = this.dependents.filter(
                (dependent) =>
                    dependent.dependentRelationId !== this.dependentRelations.find((relation) => relation.relationType === "SPOUSE").id,
            );
            filteredDependents.forEach((dependent) => {
                let disableFlag = false;
                if (
                    this.getDependentAge(dependent.birthDate) > this.maxDependentAgeInYears ||
                    this.getDependentDays(dependent.birthDate) < this.minDependentAgeInDays
                ) {
                    disableFlag = true;
                }
                this.dependentsToDisplay.push({
                    value: dependent.id,
                    viewValue: dependent.name,
                    relationId: dependent.dependentRelationId,
                    dependentAgeInDays: this.getDependentDays(dependent.birthDate),
                    dependentAgeInYears: this.getDependentAge(dependent.birthDate),
                });
            });
        }
        this.prepopulateStepValues();
        this.showSpinner = false;
    }
    /**
     * Checks for dependents min and max age and shows respective error message
     */
    checkDependentAge(): void {
        const selectedDependentId: number = this.dependentsForm.controls.dependentSelection.value;
        if (selectedDependentId) {
            const dependentData: DependentData = this.dependentsToDisplay
                .filter((dependent) => dependent.value === selectedDependentId)
                .pop();
            if (dependentData) {
                if (dependentData.dependentAgeInDays < this.minDependentAgeInDays) {
                    this.hasError = true;
                    this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.dependentMinAge"].replace(
                        "#minAge",
                        String(this.minDependentAgeInDays),
                    );
                } else if (dependentData.dependentAgeInYears > this.maxDependentAgeInYears) {
                    this.hasError = true;
                    this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.dependentMaxAge"].replace(
                        "#maxAge",
                        String(this.maxDependentAgeInYears),
                    );
                } else {
                    this.hasError = false;
                    this.errorMessage = "";
                }
                if (this.hasError) {
                    this.updateCartItemForVspDependents();
                }
            }
        }
    }
    /**
     * used to get age of child dependent in days as per the coverage effective date
     * @param birthDate - birth date of dependent
     * @returns - returns age in days
     */
    getDependentDays(birthDate: string): number {
        const coverageDate = this.planObject.application.cartData.coverageEffectiveDate;
        const effectiveDate = coverageDate ? this.dateService.toDate(coverageDate).getTime() : Date.now();
        const timeDifference = Math.abs(effectiveDate - this.dateService.toDate(birthDate).getTime());
        return Math.floor(timeDifference / MILLISECONDS_IN_DAY);
    }
    getDependentRelationFromId(relationId: number): string {
        return this.dependentRelations.find((relation) => relation.id === relationId).name;
    }

    /**
     * Handles form submission
     */
    onSubmit(): void {
        this.hideNextSectionsOnChangeOfForm();
        if (this.stepType === StepType.DEPENDENTSKAISER) {
            this.checkDependentAge();
        }
        if (this.stepType === StepType.DEPENDENTS) {
            this.updateCartItemForVspDependents();
        } else {
            if (!this.dependentsForm.valid || this.hasError) {
                this.fieldErrorflag = true;
                return;
            }
            this.dependentHasMissingAddressInfo()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    filter((hasMissingInfo) => !hasMissingInfo),
                    tap(() => {
                        this.fieldErrorflag = false;
                        this.updateCartItemForVspDependents();
                    }),
                    first(),
                )
                .subscribe();
        }
    }
    /**
     * Function to hide next section on form data changes with error
     */
    hideNextSectionsOnChangeOfForm(): void {
        if (
            !this.planObject.rider &&
            (this.planObject.currentSection.sectionId !== this.currentSectionIndex || this.planObject.currentStep !== this.currentStepIndex)
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
    }
    /**
     * Checks whether the selected dependent has missing address info.
     * Opens a modal to allow the user to fill in missing info if there is any.
     * @returns observable of whether any info is missing
     */
    dependentHasMissingAddressInfo(): Observable<boolean> {
        const dependent = this.dependents.find((dep) => dep.id === this.dependentsForm.controls.dependentSelection.value);

        // Get required info
        return combineLatest([
            this.store.select(EnrollmentState.GetMemberData),
            this.store.select(EnrollmentState.GetMemberContact),
            this.memberService.getDependentContact(this.memberId, dependent.id.toString(), this.mpGroup),
        ]).pipe(
            switchMap(([memberInfo, memberContact, dependentContact]) =>
                // If some required fields are empty, open sheet
                // Else no info is missing - return false
                iif(
                    () => REQUIRED_ADDRESS_FIELDS.some((field) => !dependentContact.address[field]),
                    defer(() =>
                        this.sheetService
                            .openSheet(CompleteRequiredDependentInfoComponent, {
                                data: {
                                    dependent: {
                                        name: `${dependent.name.firstName} ${dependent.name.lastName}`,
                                        address: dependentContact.address,
                                    },
                                    member: {
                                        name: `${memberInfo.info.name.firstName} ${memberInfo.info.name.lastName}`,
                                        address: memberContact && memberContact.address,
                                    },
                                },
                            })
                            .afterDismissed()
                            .pipe(
                                tap(() => (this.showSpinner = true)),
                                switchMap((formValue) => this.requiredInfoAfterDismissed(formValue, dependent)),
                                finalize(() => (this.showSpinner = false)),
                            ),
                    ),
                    of(false),
                ),
            ),
        );
    }

    /**
     * Handles data passed back to the component when bottom sheet is dismissed.
     * @param formValue values filled in the required info form
     * @param dependent object with info about selected dependent
     * @returns observable of whether any info is missing
     */
    requiredInfoAfterDismissed(formValue: Address, dependent: MemberDependent): Observable<boolean> {
        return iif(
            () => !!formValue,
            defer(() =>
                this.memberService.saveDependentContact({ address: formValue }, this.memberId, dependent.id.toString(), this.mpGroup).pipe(
                    switchMap(() => this.memberService.getDependentContact(this.memberId, dependent.id.toString(), this.mpGroup)),
                    map((contact) => REQUIRED_ADDRESS_FIELDS.some((field) => !contact.address[field])),
                ),
            ),
            of(true),
        );
    }
    /**
     * Saves application response
     * @returns observable of application response
     */
    saveApplicationResponse(): Observable<ApplicationResponse> {
        return this.shoppingCartService
            .saveApplicationResponse(
                this.memberId,
                this.planObject.application.cartData.id,
                this.mpGroup,
                this.getResponseObjectsToBeUpdated(),
            )
            .pipe(
                tap(() => {
                    if (this.stepType === StepType.DEPENDENTSKAISER) {
                        const coveredDependent: MemberDependent = this.dependents
                            .filter((dependent) => dependent.id === this.dependentsForm.controls["dependentSelection"].value)
                            .pop();
                        if (coveredDependent) {
                            this.appFlowService.updateCoveredDependentID$.next(coveredDependent.id);
                            this.appFlowService.updateCoveredDependentDetails$.next(
                                `${coveredDependent.name.firstName} ${coveredDependent.name.lastName}`,
                            );
                            this.updateChildAge(coveredDependent);
                            this.updateChildDependentId(coveredDependent.id);
                        }
                    }
                }),
                catchError((error) => {
                    throw error;
                }),
                finalize(() => this.onNext()),
            );
    }
    onNext(): void {
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    // this function will generate  response objects to be passed to back end
    getResponseObjectsToBeUpdated(): ApplicationResponse[] {
        const responseToBeUpdated = [];
        let stepValue = [];
        if (this.stepType === StepType.DEPENDENTSKAISER) {
            stepValue.push(this.dependentsForm.controls["dependentSelection"].value);
            responseToBeUpdated.push({
                stepId: this.stepDetails[0].id,
                type: StepType.DEPENDENTS,
                value: stepValue,
            });
        } else if (this.stepType === StepType.DEPENDENTS) {
            this.stepDetails.forEach((step) => {
                stepValue = [];
                if (step.type === StepType.DEPENDENTS) {
                    stepValue = this.selectedVspDependents;
                } else if (step.type === StepType.TAX_STATUS) {
                    stepValue.push(this.taxStatus);
                }
                responseToBeUpdated.push({
                    stepId: step.id,
                    type: step.type,
                    value: stepValue,
                });
            });
        }
        return responseToBeUpdated;
    }
    getStepDetails(): void {
        this.stepDetails = this.planObject.steps;
    }
    // this function will fetch values to pre populate
    prepopulateStepValues(): void {
        let valuesToPrePopulate: ResponsePanel[] = [];
        if (this.appResponse && this.appResponse.response) {
            valuesToPrePopulate = this.appResponse.response.filter((response) => response.stepId === this.stepDetails[0].id);
        }
        if (
            this.stepType === StepType.DEPENDENTS &&
            valuesToPrePopulate &&
            valuesToPrePopulate.length > 0 &&
            valuesToPrePopulate[0].value.length > 0
        ) {
            this.selectedVspDependents = valuesToPrePopulate[0].value;
        } else if (valuesToPrePopulate && valuesToPrePopulate.length > 0 && valuesToPrePopulate[0].value.length > 0) {
            this.dependentsForm.controls["dependentSelection"].patchValue(valuesToPrePopulate[0].value[0]);
            this.getPricingForDependent(+valuesToPrePopulate[0].value[0]);
            const coveredDependent: MemberDependent = this.dependents
                .filter((dependent) => dependent.id === +valuesToPrePopulate[0].value[0])
                .pop();
            if (coveredDependent) {
                this.updateChildAge(coveredDependent);
                this.updateChildDependentId(coveredDependent.id);
                this.appFlowService.updateCoveredDependentDetails$.next(
                    coveredDependent.name.firstName + " " + coveredDependent.name.lastName,
                );
            }
        }
    }

    updateChildAge(dependent: MemberDependent): void {
        this.store.dispatch(
            new UpdateConstraintValues(
                AllConstraint.CHILD_AGE,
                this.getDependentAge(dependent.birthDate),
                this.planObject.application.appData.id,
            ),
        );
    }

    /**
     * This method is used to open modal pop-up for adding a dependent
     * Once dialog is closed, it will call @method getDependents and update dependent listing
     */
    openAddDependentsModal(): void {
        const addDependentModal = this.empoweredService.openDialog(TpiAddDependentsComponent, {
            data: this.tpiSSODetails,
        });
        addDependentModal
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.getDependents()),
            )
            .subscribe();
    }
    /**
     * This method will navigate to add dependent screen if it is not opened from TPI flow
     * This method will open dialog to add dependent if it is opened from TPI flow
     */
    navigateToDependents(): void {
        if (this.appFlowService.checkTpi()) {
            this.openAddDependentsModal();
        } else if (this.router.url.indexOf("direct") >= 0) {
            this.router.navigate(["../../../../dependents/add"], { relativeTo: this.route });
        } else if (this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_MEMBER) {
            this.router.navigate(["/member/household/dependents/add"]);
        } else {
            // TODO : add relative route once extended shopping cart activated route issue is solved
            this.router.navigate([`/producer/payroll/${this.mpGroup}/member/${this.memberId}/dependents/add`]);
        }
    }

    /**
     * Method to find pricing for the selected child dependent based on the benefit amount
     * @param dependentId  To find which child dependent .
     * @returns  returns void.
     */
    getPricingForDependent(dependentId: number): void {
        this.showSpinner = true;
        const child = this.dependents.find((dependent) => dependent.id === dependentId);
        this.dependentAge = this.getDependentAge(child.birthDate);
        const planOfferingId = this.planObject.application.cartData.planOffering.id.toString();
        const coverageEffectiveDate = this.planObject.application.cartData.coverageEffectiveDate;

        this.shoppingService
            .getPlanOfferingPricing(
                planOfferingId,
                this.planObject.application.cartData.enrollmentState,
                null,
                this.memberId,
                this.mpGroup,
                this.planObject.rider ? this.planObject.basePlanId : null,
                this.planObject.rider ? this.planObject.application.cartData.coverageLevelId : null,
                this.planObject.application.cartData.benefitAmount ? this.planObject.application.cartData.benefitAmount : null,
                this.dependentAge,
                coverageEffectiveDate ? coverageEffectiveDate : null,
                null,
                false,
                this.planObject.application.cartData.id,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.showSpinner = false;
                this.planOfferingPrices = resp;
                const planCost = this.planOfferingPrices.find(
                    (dep) => dep.benefitAmount === this.planObject.application.cartData.benefitAmount,
                );
                if (planCost && !this.planObject.reinstate) {
                    this.appFlowService.updateCost$.next(planCost.totalCost);
                }
            });
    }

    /**
     * Get dependent's age as per the coverage effective date
     * @param birthDate dependent birth date
     */
    getDependentAge(birthDate: string): number {
        const coverageDate = this.planObject.application.cartData.coverageEffectiveDate;
        return this.dateService.getDifferenceInYears(
            this.dateService.toDate(birthDate),
            coverageDate ? this.dateService.toDate(coverageDate) : new Date(),
        );
    }
    // this function will create form fields for vsp dependents screen
    createVspFormFields(): void {
        this.stepDetails.forEach((step) => {
            if (step.type === StepType.DEPENDENTS) {
                this.dependents.forEach((dependent) => {
                    this.vspDependentsToDisplay.push({
                        value: dependent.id,
                        viewValue: dependent.name,
                        relationId: dependent.dependentRelationId,
                        disable: dependent.profile.ineligibleForCoverage || dependent.profile.courtOrdered,
                    });
                });
                this.prepopulateStepValues();
            } else if (step.type === StepType.TAX_STATUS) {
                this.taxOptions = [
                    {
                        value: TaxStatus.PRETAX,
                        viewValue: this.languageStrings["primary.portal.applicationFlow.pretaxOption"],
                    },
                    {
                        value: TaxStatus.POSTTAX,
                        viewValue: this.languageStrings["primary.portal.applicationFlow.posttaxOption"],
                    },
                ];
                this.isTaxStatusReadOnly(step);
            }
        });
        this.showSpinner = false;
    }
    onVspDependentSelectionChange(event: MatCheckboxChange): void {
        if (event.checked && this.selectedVspDependents.indexOf(event.source.value) < 0) {
            this.selectedVspDependents.push(event.source.value);
        } else {
            const dependentIndex = this.selectedVspDependents.indexOf(event.source.value);
            if (dependentIndex >= 0) {
                this.selectedVspDependents.splice(dependentIndex, 1);
            }
        }
    }
    getPlanOfferingDetails(): void {
        this.shoppingService
            .getPlanOffering(this.planObject.application.cartData.planOffering.id.toString(), this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp) {
                    this.taxStatus = resp.taxStatus;
                }
            });
    }

    /**
     * sets readOnly property of the taxStatus radio buttons
     * @param step step Data
     */
    isTaxStatusReadOnly(step: Step): void {
        // if plan is a rider plan, get the readonly property from the step details
        this.taxStatusReadOnly = this.planObject?.rider
            ? step.readOnly
            : // if plan is a base plan, readOnly property will be decided based on the taxStatus, OE and QLEPeriod
              this.planObject.reinstate ||
              (this.taxStatus === TaxStatus.VARIABLE && !this.isOpenEnrollment && !this.isQLEPeriod) ||
              this.taxStatus !== TaxStatus.VARIABLE;
    }

    // this function will get coverage levels for the plan from back end
    getCoverageLevels(): void {
        this.showSpinner = true;
        const coverageRulesAPICalls = [];
        this.coreService
            .getCoverageLevels(this.planObject.application.planId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: CoverageLevel[]) => {
                    this.coverageLevels = response;
                    response.forEach((coverageLevel) => {
                        coverageRulesAPICalls.push(
                            this.coreService.getCoverageLevelRule(
                                coverageLevel.id.toString(),
                                this.planObject.application.cartData.enrollmentState,
                                this.planObject.application.planId.toString(),
                            ),
                        );
                    });
                    this.fetchCoverageRules(coverageRulesAPICalls);
                },
                (error) => {
                    this.showSpinner = false;
                },
            );
    }
    // this function will fetch coverage level rules for the plan from back end
    fetchCoverageRules(coverageRulesAPICalls: Observable<any>[]): void {
        forkJoin(coverageRulesAPICalls)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    response.forEach((resp, i) => {
                        this.coverageRules.push({
                            coverageLevelId: this.coverageLevels[i].id,
                            coverageLevelRule: resp,
                        });
                    });
                    this.showSpinner = false;
                },
                (error) => {
                    this.showSpinner = false;
                },
            );
    }
    // this function will dteermine coverage level if the rule is passed
    getCoverageLevelFromCoverageRules(): number {
        let coverageLevelIdToReturn;
        this.coverageRules.forEach((rule) => {
            if (rule && this.validateCoverageLevelRule(rule.coverageLevelRule)) {
                coverageLevelIdToReturn = rule.coverageLevelId;
            }
        });
        return coverageLevelIdToReturn;
    }
    // this function will validate coverage level rule
    validateCoverageLevelRule(rule: CoverageLevelRule): boolean {
        let flagToReturn = false;
        if (
            this.selectedVspDependents.length >= rule.minDependents &&
            (rule.maxDependents ? this.selectedVspDependents.length <= rule.maxDependents : true)
        ) {
            flagToReturn = true;
        }
        return flagToReturn;
    }
    /**
     * method to fetch plan prices
     */
    getPlanPricing(): void {
        const planOfferingId: string = this.planObject.application.cartData.planOffering.id.toString();
        const coverageEffectiveDate: string = this.planObject.application.cartData.coverageEffectiveDate;
        const cartData: GetCartItems = this.planObject.application.cartData;
        let riskClassOverrideId: number;
        if (cartData.riskClassOverrideId) {
            riskClassOverrideId = cartData.riskClassOverrideId;
        } else if (this.planObject.application.carrierId === CarrierId.AFLAC) {
            const currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
            if (currentAccount && currentAccount.ratingCode === RatingCode.DUAL) {
                riskClassOverrideId = this.appFlowService.getDualAccountRiskClassId(this.planObject.application.productId);
            } else {
                riskClassOverrideId = this.store.selectSnapshot(EnrollmentState.GetMemberData).riskClassId;
            }
        }

        this.shoppingService
            .getPlanOfferingPricing(
                planOfferingId,
                this.planObject.application.cartData.enrollmentState,
                null,
                this.memberId,
                this.mpGroup,
                this.planObject.rider ? this.planObject.basePlanId : null,
                this.planObject.rider ? this.planObject.application.cartData.coverageLevelId : null,
                null,
                null,
                coverageEffectiveDate ? coverageEffectiveDate : null,
                riskClassOverrideId,
                true,
                this.planObject.application.cartData.id,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.planOfferingPrices = resp;
            });
    }
    /**
     * Method to get the cost for a coverage level
     * @param coverageLevelID
     * @returns Cost for a coverage level id
     */
    getCostFromCoverageLevelID(coverageLevelID: number): number {
        const coveragePrice = this.getCoveragePrice(coverageLevelID);
        if (coveragePrice) {
            return coveragePrice.totalCost;
        }
        return 0.0;
    }

    /**
     * Method to determine the cost based on the coverage level selection
     * @param coverageLevelId selected coverage level
     * @returns {number} memberCost
     */
    getMemberCostFromCoverageLevelId(coverageLevelId: number): number {
        const coveragePrice = this.getCoveragePrice(coverageLevelId);
        if (coveragePrice) {
            return coveragePrice.memberCost;
        }
        return 0.0;
    }

    /**
     * Method to determine the cost based on the coverage level selection
     * @param coverageLevelId selected coverage level
     * @returns {PlanOfferingPricing} coverage pricing
     */
    getCoveragePrice(coverageLevelId: number): PlanOfferingPricing {
        return this.planOfferingPrices.find(
            (price) =>
                price.coverageLevelId === coverageLevelId &&
                (!this.planObject.application.cartData.benefitAmount ||
                    price.benefitAmount === this.planObject.application.cartData.benefitAmount),
        );
    }
    /**
     * this function will update cart for vsp dependents selection with cost
     */
    updateCartItemForVspDependents(): void {
        const coverageLevelId = this.getCoverageLevelFromCoverageRules();
        const coverageEffectiveDate = this.planObject.application.cartData.coverageEffectiveDate;
        const ageOfDependent = this.dependentAge ? this.dependentAge : this.planObject.application.cartData.dependentAge;
        const cartData: AddCartItem = {
            benefitAmount: this.planObject.application.cartData.benefitAmount,
            memberCost: this.getMemberCostFromCoverageLevelId(coverageLevelId),
            totalCost: this.getCostFromCoverageLevelID(coverageLevelId),
            enrollmentMethod: this.planObject.application.cartData.enrollmentMethod,
            enrollmentState: this.planObject.application.cartData.enrollmentState,
            enrollmentCity: this.planObject.application.cartData.enrollmentCity,
            planOfferingId: this.planObject.application.cartData.planOffering.id,
            dependentAge: ageOfDependent ? ageOfDependent : null,
            coverageLevelId: coverageLevelId,
            riders: this.planObject.application.cartData.riders,
            assistingAdminId: this.appFlowService.mapAssistingAdminId(this.planObject.application.cartData.assistingAdminId),
            riskClassOverrideId: this.planObject.application.cartData.riskClassOverrideId
                ? this.planObject.application.cartData.riskClassOverrideId
                : null,
            coverageEffectiveDate: coverageEffectiveDate ? this.appFlowService.getCoverageDateToUpdateCart(coverageEffectiveDate) : null,
            subscriberQualifyingEventId:
                this.planObject.application.cartData.planOffering &&
                this.planObject.application.cartData.planOffering.planYearId &&
                this.currentQleId
                    ? this.planObject.application.cartData.subscriberQualifyingEventId
                    : null,
        };
        if (this.store.selectSnapshot(SharedState.portal) === Portals.MEMBER || this.appFlowService.checkTpi()) {
            cartData.riskClassOverrideId = null;
        }
        if (this.hasError && this.stepType === StepType.DEPENDENTSKAISER) {
            cartData.status = CartStatus.TODO;
        }
        this.shoppingService
            .updateCartItem(this.memberId, this.mpGroup, this.planObject.application.cartData.id, cartData)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap(() =>
                    !(this.hasError && this.stepType === StepType.DEPENDENTSKAISER) ? this.saveApplicationResponse() : of(null),
                ),
                switchMap(() =>
                    this.store.dispatch([
                        new UpdateCartData(this.planObject.application.cartData.id, this.planObject.application.cartData.planOffering.id),
                    ]),
                ),
                first(),
            )
            .subscribe(
                (resp) => {
                    this.hasError = this.hasError && this.stepType === StepType.DEPENDENTSKAISER;
                },
                (error) => {
                    this.hasError = true;
                    this.errorMessage = this.secondaryLanguageString["secondary.portal.applicationFlow.dependentMaxAge"].replace(
                        "#maxAge",
                        String(this.maxDependentAgeInYears),
                    );
                },
            );
    }

    checkPrePopulationStatus(id: number): boolean | undefined {
        if (this.selectedVspDependents.length) {
            return this.selectedVspDependents.indexOf(id) >= 0;
        }
        return undefined;
    }
    /**
     * updates dependent id of selected child to store
     * @param dependentId dependent id of selected child
     */
    updateChildDependentId(dependentId: number): void {
        this.appFlowService.updateCoveredDependentID$.next(dependentId);
        this.store.dispatch(
            new UpdateConstraintValues(AllConstraint.DEPENDENT_CHILD_ID, dependentId, null, this.planObject.application.cartData.id),
        );
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
