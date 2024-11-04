import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject, iif, combineLatest, of, Observable } from "rxjs";
import { SharedState, FetchConfigs } from "../../shared";
import { switchMap, map, take } from "rxjs/operators";
import { ClassNames, Region, AccountProfileService, BenefitsOfferingMode, AccountService } from "@empowered/api";
import { AccountImportTypes, AppSettings } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { InitialBenefitsOfferingSteps } from "../../benefits-offering/constants/initial-offering-steps-data";
import { SetStepperData } from "../../benefits-offering/benefits-offering.action";
import { BenefitsOfferingState } from "../../benefits-offering/benefits-offering.state";
import { MaintenanceAddProductsSteps } from "../../benefits-offering/constants/maintenance-offering-steps-data";
import { AccountListState } from "../../account-list/account-list.state";
import { AccountInfoState } from "../../dashboard/dashboard.state";

const SHOW_PRICING_ELIGIBILITY_CONFIG = "broker.plan_year_setup.show_pricing_eligibility_step";
const GROUP_OFFERING_ATTRIBUTE_STEP = "group_benefit_offering_step";

@Injectable({
    providedIn: "root",
})
export class SideNavService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public stepClicked$ = new Subject<any>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public planChanged$ = new Subject<number>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public defaultStepPositionChanged$ = new Subject<number>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public planChoiceMade$ = new Subject<any>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public benefitFilterChanged$ = new BehaviorSubject<any>(null);

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public executePlanOnNext$ = new Subject<string>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public changeProduct$ = new Subject<boolean>();

    /**
     * @var benefitsOfferingMode is used to determine the mode of benefits offering
     * [i.e., either in Initial BO or maintenance BO]
     */
    benefitsOfferingMode: BenefitsOfferingMode;

    constructor(
        private readonly store: Store,
        private readonly accountProfileService: AccountProfileService,
        private readonly accountService: AccountService,
    ) {}
    /**
     * This method used to update filter form array
     * @param data this parameter contains filter formgroup
     */
    updateFilterData(data: any): void {
        this.benefitFilterChanged$.next(data);
    }
    /**
     * Hides pricing step:
     * if partner is Aflac
     * and "broker.plan_year_setup.show_pricing_eligibility_step" is "FALSE"
     * and there are no classes/regions set up for this account.
     * @param maintenanceMode specifies if initial benefits offering is already submiited.
     */

    initializeStepperData(maintenanceMode: boolean): void {
        const stepperObj = maintenanceMode ? MaintenanceAddProductsSteps : InitialBenefitsOfferingSteps;
        const accountInfo = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.store
            .dispatch(new FetchConfigs(SHOW_PRICING_ELIGIBILITY_CONFIG))
            .pipe(
                // If the required config is "TRUE", check if classes and regions are set up.
                switchMap(() =>
                    iif(
                        () =>
                            accountInfo.partnerId &&
                            accountInfo.partnerId === AppSettings.AFLAC_PARTNER_ID &&
                            this.store.selectSnapshot(SharedState.getConfig(SHOW_PRICING_ELIGIBILITY_CONFIG)).value.toLowerCase() ===
                                AppSettings.TRUE,
                        combineLatest([this.getClasses$(), this.getRegions$()]),
                        of([[], []]),
                    ),
                ),
                take(1),
            )
            .subscribe(([classes, regions]) => {
                if (accountInfo && accountInfo.importType === AccountImportTypes.SHARED_CASE && !maintenanceMode) {
                    this.store.dispatch(
                        new SetStepperData(
                            classes.length === 0 && regions.length === 0
                                ? InitialBenefitsOfferingSteps.aflacGroupReviewWithoutPricing
                                : InitialBenefitsOfferingSteps.aflacGroupReviewWithPricing,
                        ),
                    );
                } else {
                    this.store.dispatch(
                        new SetStepperData(
                            classes.length === 0 && regions.length === 0
                                ? // Show pricing only if classes/regions are set up.
                                stepperObj.withoutPricing
                                : stepperObj.withPricing,
                        ),
                    );
                }
            });
    }
    /**
     * Fetches class types and then fetches the classes under each type.
     * @returns observable of an array all the classes
     */
    private getClasses$(): Observable<ClassNames[]> {
        return this.accountProfileService.getClassTypes().pipe(
            map((classTypes) => classTypes.filter((classType) => classType.visible === true)),
            switchMap((classTypes) =>
                iif(
                    () => classTypes && classTypes.length > 0,
                    combineLatest(classTypes.map((classType) => this.accountProfileService.getClasses(classType.id))).pipe(
                        map((classes) => [].concat(...(classes || []))),
                    ),
                    of([]),
                ),
            ),
        );
    }
    /**
     * Fetches region types and then fetches the regions under each type.
     * @returns observable of an array all the regions
     */
    private getRegions$(): Observable<Region[]> {
        return this.accountProfileService
            .getRegionTypes()
            .pipe(
                switchMap((regionTypes) =>
                    iif(
                        () => regionTypes && regionTypes.length > 0,
                        combineLatest(regionTypes.map((regionType) => this.accountProfileService.getRegions(regionType.id))).pipe(
                            map((regions) => [].concat(...(regions || []))),
                        ),
                        of([]),
                    ),
                ),
            );
    }
    fetchAccountStatus(): boolean {
        const accountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        return accountDetails.status === AppSettings.INACTIVE ? true : false;
    }
    /**
     * function to fetch current account situs
     * @returns current account situs state abbreviation
     */
    fetchAccountSitus(): string {
        const accountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        return accountDetails.situs.state.abbreviation;
    }

    /**
     * This method is used to set mode of BenefitsOffering
     * @param mode is an enum of BenefitsOfferingMode
     * This method accepts @param mode and sets the value to @variable benefitsOfferingMode
     */
    setBenefitsOfferingMode(mode: BenefitsOfferingMode): void {
        this.benefitsOfferingMode = mode;
    }
    /**
     * This method is used to get the mode of BenefitsOffering
     * @returns value of @variable benefitsOfferingMode
     */
    getBenefitsOfferingMode(): BenefitsOfferingMode {
        return this.benefitsOfferingMode;
    }

    /**
     * method to update the value of group attribute
     * @param value as group attribute value
     * @return Observable<HttpResponse<unknown>>
     */
    updateGroupBenefitOfferingStep(value: string): Observable<HttpResponse<unknown>> {
        const groupAttributeId = this.store.selectSnapshot(BenefitsOfferingState.getGroupAttributeId);
        const groupAttribute = {
            id: groupAttributeId,
            attribute: GROUP_OFFERING_ATTRIBUTE_STEP,
            value: value,
        };
        if (!groupAttributeId) {
            const mpGroup = this.store.selectSnapshot(AccountListState.getGroup).id;
            return this.accountService.getGroupAttributesByName([GROUP_OFFERING_ATTRIBUTE_STEP], mpGroup).pipe(
                switchMap(([attribute]) =>
                    iif(
                        () => attribute && attribute.id !== null,
                        this.accountService.updateGroupAttribute(attribute.id, {
                            id: attribute.id,
                            attribute: GROUP_OFFERING_ATTRIBUTE_STEP,
                            value: value,
                        }),
                        of(null),
                    ),
                ),
            );
        }
        return this.accountService.updateGroupAttribute(groupAttributeId, groupAttribute);
    }
}
