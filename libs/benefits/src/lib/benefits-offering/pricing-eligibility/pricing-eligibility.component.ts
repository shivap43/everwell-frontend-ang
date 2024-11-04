import { Component, Output, HostListener, OnDestroy } from "@angular/core";
import { BenefitsOfferingState, SetPopupExitStatus } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { RegionType, AccountProfileService, Region, RegionNames, ClassType, ClassNames, BenefitsOfferingService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { take } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subject, Subscription } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { MonDialogData, MonDialogComponent } from "@empowered/ui";

@Component({
    selector: "empowered-pricing-eligibility",
    templateUrl: "./pricing-eligibility.component.html",
    styleUrls: ["./pricing-eligibility.component.scss"],
})
export class PricingEligibilityComponent implements OnDestroy {
    mpGroup: number;
    allRegions: RegionNames[] = [];
    regionNames = [];
    allClasses: ClassNames[] = [];
    allRiskClasses: ClassNames[] = [];
    allClassesTypes: ClassType[] = [];
    undoOrCancel: string;
    classNames = [];
    riskClass = [];
    employeeCombinations: any;
    newEmployeeCombinations: any;
    planName: string;
    planchoiceId: number;
    planYearId: number;
    effectiveStarting: string;
    expiresAfter: string;
    isDisplaySetPricing = false;
    isPopupRequired = false;
    @Output() emitdisplaySetPricing: boolean;
    private allowNavigation$ = new Subject<boolean>();
    exitPopupStatus = false;
    isLoading = false;
    isPreviousDisplay = false;
    isNextDisplay = false;
    subscription: Subscription[] = [];
    planchoiceIds: number[];
    isEditPricesFlag = false;
    @Select(BenefitsOfferingState.GetExitPopupStatus) exitPopupStatus$: Observable<boolean>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.pricingEligible.popup.heading",
        "primary.portal.pricingEligible.popup.instruction",
        "primary.portal.pricingEligible.popup.leaveWithoutSaving",
        "primary.portal.common.cancel",
        "primary.portal.planList.title",
        "primary.portal.common.previousPlan",
        "primary.portal.common.nextPlan",
    ]);
    constructor(
        private readonly accountProfileService: AccountProfileService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
    ) {
        this.subscription.push(
            this.route.params.subscribe((params) => {
                this.planchoiceId = +this.route.snapshot.paramMap.get("planId");
                this.isLoading = true;
                this.getAllRegions();
                this.getAllClasses();
                this.readCombinationFromStore();
                this.store.dispatch(new SetPopupExitStatus(false));
            }),
        );
        this.subscription.push(this.exitPopupStatus$.subscribe((x) => (this.exitPopupStatus = x)));
    }

    gotoPlanList(): void {
        const url = `${this.router.url}`;
        let lastIndex = this.router.url.lastIndexOf("/");
        let slicedUrl = this.router.url.slice(0, lastIndex);
        lastIndex = slicedUrl.lastIndexOf("/");
        slicedUrl = slicedUrl.slice(0, lastIndex);
        slicedUrl = `${slicedUrl}/5`;
        this.router.navigate([slicedUrl]);
    }

    readCombinationFromStore(): void {
        this.planchoiceIds = [];
        const localStore = this.store.selectSnapshot(BenefitsOfferingState.getProductCombinations);
        if (localStore != null) {
            localStore.forEach((item) => {
                this.planchoiceIds.push(item.choiceId);
            });
        }
        this.displayButtons();
        const index = localStore.findIndex((x) => x.choiceId.toString() === this.planchoiceId.toString());
        let currentPlan;
        if (index > -1 && localStore[index] != null) {
            this.isDisplaySetPricing = localStore[index].combinations.length > 0 ? true : false;
            if (
                localStore[index].product != null &&
                localStore[index].product.plansDetails != null &&
                localStore[index].product.plansDetails.length
            ) {
                const planDetailObject = localStore[index].product.plansDetails;
                currentPlan = planDetailObject.filter((x) => x.planChoice.id === this.planchoiceId);
                this.planName = currentPlan[0].plan.name;
                this.planYearId = currentPlan[0].planChoice.planYearId;

                this.getPlanYears();
            }
        }
    }

    getPlanYears(): void {
        this.benefitOfferingService
            .getPlanYear(this.planYearId, this.mpGroup, true)
            .pipe(take(1))
            .subscribe(
                (res) => {
                    this.effectiveStarting = res.coveragePeriod.effectiveStarting;
                    this.expiresAfter = res.coveragePeriod.expiresAfter;
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getAllRegions(): void {
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.accountProfileService
            .getRegionTypes(this.mpGroup)
            .pipe(take(1))
            .subscribe(
                (regionTypesResponse: RegionType[]) => {
                    this.regionNames = [];
                    regionTypesResponse.forEach((regionType) => {
                        this.accountProfileService
                            .getRegions(regionType.id, this.mpGroup)
                            .pipe(take(1))
                            .subscribe(
                                (regions: Region[]) => {
                                    const index = this.regionNames.findIndex((x) => x.id === 0);
                                    if (index === -1) {
                                        this.regionNames.push({
                                            id: 0,
                                            name: "All regions",
                                            composition: { states: [] },
                                            numberOfMembers: 0,
                                            default: false,
                                            isselected: false,
                                        });
                                    }
                                    this.regionNames.push(...regions.filter((x) => x.name !== ""));
                                    this.allRegions = this.regionNames;
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            );
                    });
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    getAllClasses(): void {
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.accountProfileService
            .getClassTypes(this.mpGroup.toString())
            .pipe(take(1))
            .subscribe(
                (classTypesResponse: ClassType[]) => {
                    this.classNames = [];
                    this.allClassesTypes = classTypesResponse;
                    classTypesResponse.forEach((classType) => {
                        this.accountProfileService
                            .getClasses(classType.id, this.mpGroup.toString())
                            .pipe(take(1))
                            .subscribe(
                                (Response) => {
                                    const index = this.classNames.findIndex((x) => x.id === 0);
                                    if (index === -1) {
                                        this.classNames.push({
                                            id: 0,
                                            name: "All classes",
                                            numberOfMembers: 0,
                                            default: true,
                                            isselected: false,
                                        });
                                    }
                                    this.classNames.push(...Response.filter((x) => x.name !== ""));
                                    this.allClasses = this.classNames.filter((x) => x.riskClass === undefined);
                                    const riskclass = Response.filter((x) => x.riskClass !== undefined);
                                    if (riskclass.length > 0) {
                                        this.fetchRiskClasses(riskclass);
                                    }
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            );
                    });
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }
    fetchRiskClasses(inputClasses: ClassNames[]): void {
        this.riskClass = [];
        inputClasses.forEach((item) => {
            if (item.riskClass !== undefined && !this.allClassesTypes.filter((x) => x.name === item.name).length) {
                this.riskClass.push(item);
                this.allRiskClasses = this.riskClass;
            }
        });
    }

    storeEmployeeCombinations(combinations: any): void {
        this.employeeCombinations = combinations;
    }
    createEmployeeCombinations(combinations: any): void {
        this.newEmployeeCombinations = combinations;
    }
    displaySetPricingState(displayPrice: boolean): void {
        this.isDisplaySetPricing = displayPrice;
    }

    @HostListener("window:beforeunload")
    canDeactivate(): Observable<boolean> | boolean {
        let response: any;
        if (this.exitPopupStatus) {
            this.allowNavigation$ = new Subject<boolean>();
            this.showUnSavedChangesPopup();
            response = this.allowNavigation$.asObservable();
        } else if (!this.exitPopupStatus) {
            this.onAlertConfirm(true);
            response = true;
        }
        return response;
    }

    onAlertConfirm(flag: boolean): void {
        this.allowNavigation$.next(flag);
        this.allowNavigation$.complete();
        if (flag) {
            this.store.dispatch(new SetPopupExitStatus(false));
        }
    }

    showUnSavedChangesPopup(): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.pricingEligible.popup.heading"],
            content: this.languageStrings["primary.portal.pricingEligible.popup.instruction"],
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.pricingEligible.popup.leaveWithoutSaving"],
                buttonAction: this.onAlertConfirm.bind(this, true),
                buttonClass: "mon-btn-primary",
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                buttonAction: this.onAlertConfirm.bind(this, false),
            },
        };

        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    previousPlan(): void {
        const currentUrl = this.router.url;
        const lastIndex = currentUrl.lastIndexOf("/");
        const planchoiceUrl = currentUrl.slice(0, lastIndex);
        const currentindex = this.planchoiceIds.indexOf(this.planchoiceId);
        this.displayButtons();
        if (currentindex - 1 >= 0) {
            const previousPlanChoiceId = this.planchoiceIds[currentindex - 1];
            const previousPlanUrl = `${planchoiceUrl}/${previousPlanChoiceId}`;

            this.router.navigate([previousPlanUrl], { skipLocationChange: true });
        }
    }

    nextPlan(): void {
        const currentUrl = this.router.url;
        const lastIndex = currentUrl.lastIndexOf("/");
        const planchoiceUrl = currentUrl.slice(0, lastIndex);
        const currentindex = this.planchoiceIds.indexOf(this.planchoiceId);
        this.displayButtons();
        if (currentindex + 1 < this.planchoiceIds.length) {
            const nextPlanChoiceId = this.planchoiceIds[currentindex + 1];
            const nextPlanUrl = `${planchoiceUrl}/${nextPlanChoiceId}`;
            this.router.navigate([nextPlanUrl], { skipLocationChange: true });
        }
    }
    displayButtons(): void {
        const currentindex = this.planchoiceIds.indexOf(this.planchoiceId);
        if (currentindex > 0 && currentindex < this.planchoiceIds.length - 1) {
            this.isPreviousDisplay = true;
            this.isNextDisplay = true;
        } else if (currentindex === 0 && this.planchoiceIds.length > 1) {
            this.isPreviousDisplay = false;
            this.isNextDisplay = true;
        } else if (currentindex > 0 && currentindex === this.planchoiceIds.length - 1) {
            this.isPreviousDisplay = true;
            this.isNextDisplay = false;
        }
    }
    revertCombinations(event: any): void {
        this.undoOrCancel = event;
    }
    showCombinationPopup(isPopupRequired: boolean): void {
        this.isPopupRequired = isPopupRequired;
    }
    setEditFlag(event: boolean): void {
        this.isEditPricesFlag = event;
    }
    ngOnDestroy(): void {
        this.subscription.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
