import { Carrier, MemberFullProfile } from "@empowered/api";
import { PayFrequency, ScenarioObject, MEMBERWIZARD, PlanYear } from "@empowered/constants";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MemberWizardModel {
    dependentList: any[];
    userData: MemberFullProfile;
    wizardMenuTab: any[];
    relations: any[];
    payFrequency: PayFrequency;
    coverageData: any[];
    currentFlow: MEMBERWIZARD;
    totalCost: number;
    planYear: PlanYear[];
    scenarioObject: ScenarioObject;
    allCarriers: Carrier[];
}
