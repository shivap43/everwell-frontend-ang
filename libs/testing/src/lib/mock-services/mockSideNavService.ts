import { of, Subject } from "rxjs";

export const mockSideNavService = {
    executePlanOnNext$: of({}),
    updateGroupBenefitOfferingStep: (value: string) => of({}),
    planChanged$: {},
    changeProduct$: {},
    planChoiceMade$: {},
    defaultStepPositionChanged$: {},
    stepClicked$: new Subject<any>(),
    benefitFilterChanged$: {},
    updateFilterData: (data: any) => void {},
    fetchAccountStatus: () => true,
};
