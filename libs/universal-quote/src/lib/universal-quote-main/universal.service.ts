import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from "rxjs";
@Injectable({
    providedIn: "root",
})
export class UniversalService {
    currentProductId$ = new Subject<number>();
    adminPreferenceUpdated$ = new BehaviorSubject<boolean>(false);
    planSelectionUpdated$ = new BehaviorSubject<boolean>(false);
    adminContactUpdated$ = new Subject<{ updated: boolean; state: string }>();
    levelSettingUpdated$ = new BehaviorSubject<boolean>(false);
    zeroState$ = new Subject<boolean>();
    cdkSelectionUpdate$ = new Subject<boolean>();
    planOrderUpdated$ = new Subject<any>();
    selectionUpdated$ = new Subject<any>();
    resetButtonTapped$ = new BehaviorSubject<boolean>(false);
    riderSelectedBenefitAmount$ = new BehaviorSubject<Map<number, number>>(null);
    private readonly setEliminationPeriod$ = new BehaviorSubject<unknown>({});
    eliminationPeriodSelected = this.setEliminationPeriod$.asObservable();
    private readonly setBenefitAmount$ = new BehaviorSubject<{
        benefitAmountValue: Map<number, string>;
        planBenAmtRadio: Map<number, string>;
    }>(null);
    setBenefitAmount = this.setBenefitAmount$.asObservable();
    riderSelectedBenefitAmount = this.riderSelectedBenefitAmount$.asObservable();
    private readonly setChildAge$ = new BehaviorSubject<{ planId: number | string; childAge: number }>(null);
    setChildAge = this.setChildAge$.asObservable();
    constructor() {}
    /**
     * Function to update elimination period value
     * @param data elimination data with selected plan
     */
    updateEliminationPeriod(data: unknown): void {
        this.setEliminationPeriod$.next(data);
    }
    /**
     * Function to update benefit amount value
     * @param data benefit amount data with selected plan
     */
    updateBenefitAmount(data: { benefitAmountValue: Map<number, string>; planBenAmtRadio: Map<number, string> }): void {
        this.setBenefitAmount$.next(data);
    }
    /**
     * Function to update rider benefit amount value
     * @param riderSelectedBenefitAmount benefit amount data with selected rider
     */
    updateSelectedRiderBenefitAmount(riderSelectedBenefitAmount: Map<number, number>): void {
        this.riderSelectedBenefitAmount$.next(riderSelectedBenefitAmount);
    }
    /**
     * Function to update child age value
     * @param data child age data with selected plan
     */
    updateChildAge(data: { planId: number | string; childAge: number }): void {
        this.setChildAge$.next(data);
    }
}
export interface QuoteLevelSetting {
    state?: string;
    channel?: string;
    payFrequency?: string;
    riskClass?: string;
    eligibleSubscribers?: number;
}
export enum MoreSettingsEnum {
    AGE = "age",
    GENDER = "gender",
    SIC_CODE = "sicCode",
    ZIP_CODE = "zipCode",
    TOBACCOUSER = "tobaccoUser",
    SPOUSEAGE = "spouseAge",
    SPOUSEGENDER = "spouseGender",
    SPOUSETOBACCOUSER = "spouseTobaccoUser",
    NUMBERDEPENDENTSEXCLUDINGSPOUSE = "numberDependentsExcludingSpouse",
    ELIGIBLE_SUBSCRIBERS = "eligibleSubscribers",
    RESIDENCESTATE = "state",
    PARTNERACCOUNTTYPE = "partnerAccountType",
    RISKCLASSID = "riskClassId",
    PAYROLLFREQUENCYID = "payrollFrequencyId",
    ANNUALSALARY = "annualSalary",
}
