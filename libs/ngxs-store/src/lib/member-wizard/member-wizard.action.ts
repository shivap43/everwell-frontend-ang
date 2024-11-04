/* eslint-disable max-classes-per-file */

import { PayFrequency, ScenarioObject, MEMBERWIZARD, PlanYear } from "@empowered/constants";

export class UpdateDependentInList {
    static readonly type = "[DependentList] UpdateDependentInList";

    constructor(public dependent: any) {}
}

export class SetDependentList {
    static readonly type = "[DependentList] SetDependentList";

    constructor(public dependentList: any[]) {}
}
export class AddDependentToList {
    static readonly type = "[DependentList] AddDependentToList";

    constructor(public dependent: any) {}
}
export class SetUserData {
    static readonly type = "[DependentList] SetUserData";

    constructor(public userData: any) {}
}
export class SetWizardMenuTab {
    static readonly type = "[WizardTab] SetWizardMenuTab";

    constructor(public tabMenu: any[]) {}
}
export class SetMemberRelations {
    static readonly type = "[DependentRelation] SetMemberRelations";

    constructor(public relations: any[]) {}
}

export class SetMemberPayFrequency {
    static readonly type = "[PayFrequency] SetMemberPayFrequency";

    constructor(public payFrequency: PayFrequency) {}
}
export class SetCoverageData {
    static readonly type = "[CoverageData] SetCoverageData";

    constructor(public coverageData: any[]) {}
}
export class SetCurrentFlow {
    static readonly type = "[Current Flow] SetCurrentFlow";

    constructor(public flow: MEMBERWIZARD) {}
}
export class SetTotalCost {
    static readonly type = "[SetTotalCost] SetTotalCost";

    constructor(public cost: number) {}
}
export class SetPlanYear {
    static readonly type = "[SetPlanYear] SetPlanYear";

    constructor(public planYear: PlanYear[]) {}
}
export class SetScenarioObject {
    static readonly type = "[SetScenarioObject] SetScenarioObject";

    constructor(public scenarioObject: ScenarioObject) {}
}
export class SetAllCarriersMMP {
    static readonly type = "[SetAllCarriersMMP] SetAllCarriersMMP";

    constructor(public stateCode?: string) {}
}
