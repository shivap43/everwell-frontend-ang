import { Action, Selector, State, StateContext } from "@ngxs/store";
import { MemberWizardModel } from "./member-wizard.model";
import {
    UpdateDependentInList,
    SetDependentList,
    AddDependentToList,
    SetUserData,
    SetWizardMenuTab,
    SetMemberRelations,
    SetMemberPayFrequency,
    SetCoverageData,
    SetCurrentFlow,
    SetTotalCost,
    SetPlanYear,
    SetScenarioObject,
    SetAllCarriersMMP,
} from "./member-wizard.action";
import { Carrier, CoreService, MemberFullProfile } from "@empowered/api";
import { PayFrequency, ScenarioObject, MEMBERWIZARD, PlanYear } from "@empowered/constants";
import { ResetState } from "@empowered/user/state/actions";

import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { patch } from "@ngxs/store/operators";
import { DateService } from "@empowered/date";

const defaultState: MemberWizardModel = {
    dependentList: [],
    userData: null,
    wizardMenuTab: undefined,
    relations: [],
    payFrequency: null,
    coverageData: [],
    currentFlow: MEMBERWIZARD.OE_FRESHMAN_OR_NON_FRESHMAN,
    totalCost: 0,
    planYear: [],
    scenarioObject: null,
    allCarriers: [],
};

@State<MemberWizardModel>({
    name: "MemberWizardState",
    defaults: defaultState,
})
@Injectable()
export class MemberWizardState {
    constructor(private readonly coreService: CoreService) {}

    @Selector()
    static GetDependentList(state: MemberWizardModel): any[] {
        return state.dependentList;
    }
    @Selector()
    static GetPlanYear(state: MemberWizardModel): PlanYear[] {
        return state.planYear;
    }
    @Selector()
    static GetUserData(state: MemberWizardModel): MemberFullProfile {
        return state.userData;
    }
    @Selector()
    static GetTotalCost(state: MemberWizardModel): number {
        return state.totalCost;
    }
    @Selector()
    static GetWizardTabMenu(state: MemberWizardModel): any[] {
        return state.wizardMenuTab;
    }
    @Selector()
    static GetRelations(state: MemberWizardModel): any[] {
        return state.relations;
    }
    @Selector()
    static GetPayFrequency(state: MemberWizardModel): PayFrequency {
        return state.payFrequency;
    }
    @Selector()
    static GetCoverageData(state: MemberWizardModel): any[] {
        return state.coverageData;
    }
    @Selector()
    static GetCurrentFlow(state: MemberWizardModel): MEMBERWIZARD {
        return state.currentFlow;
    }
    @Selector()
    static GetCurrentState(state: MemberWizardModel): MemberWizardModel {
        return state;
    }
    @Selector()
    static GetDefaultState(state: MemberWizardModel): MemberWizardModel {
        return defaultState;
    }
    @Selector()
    static GetScenarioObject(state: MemberWizardModel): ScenarioObject {
        return state.scenarioObject;
    }
    /**
     * Selector to get cart items
     * @param state : Member wizard state model
     * @returns {boolean} TRUE if plan year is in OE else FALSE
     */
    @Selector()
    static IsOpenEnrollment(state: MemberWizardModel): boolean {
        let dateService: DateService;
        let isOE = false;
        if (state.planYear && state.planYear.length) {
            isOE = state.planYear.some(
                (py) =>
                    dateService.isBeforeOrIsEqual(dateService.toDate(py.enrollmentPeriod.effectiveStarting), new Date()) &&
                    dateService.getIsAfterOrIsEqual(dateService.toDate(py.enrollmentPeriod.expiresAfter), new Date()),
            );
        }
        return isOE;
    }
    @Selector()
    static GetAllCarriers(state: MemberWizardModel): Carrier[] {
        return state.allCarriers;
    }
    @Action(ResetState)
    resetState(context: StateContext<MemberWizardModel>): void {
        context.setState(defaultState);
    }
    @Action(UpdateDependentInList)
    UpdateDependentInList({ getState, patchState }: StateContext<MemberWizardModel>, { dependent }: UpdateDependentInList): void {
        const state = getState();
        const tempDependentList = [...state.dependentList];
        const idx = tempDependentList.findIndex((x) => x.id === dependent.id);
        if (idx > -1) {
            let tempDependent: any = { ...tempDependentList[idx] };
            tempDependent = { ...dependent };
            tempDependentList[idx] = tempDependent;
            patchState({
                dependentList: tempDependentList,
            });
        }
    }
    @Action(SetDependentList)
    setMemberId({ patchState }: StateContext<MemberWizardModel>, { dependentList }: SetDependentList): void {
        patchState({
            dependentList: dependentList,
        });
    }
    @Action(AddDependentToList)
    AddDependentToList({ getState, patchState }: StateContext<MemberWizardModel>, { dependent }: AddDependentToList): void {
        const state = getState();
        const tempDependentList = [...state.dependentList];
        tempDependentList.push(dependent);
        patchState({
            dependentList: tempDependentList,
        });
    }
    @Action(SetUserData)
    SetUserData({ patchState }: StateContext<MemberWizardModel>, { userData }: SetUserData): void {
        patchState({
            userData: userData,
        });
    }
    @Action(SetWizardMenuTab)
    SetWizardMenuTab({ patchState }: StateContext<MemberWizardModel>, { tabMenu }: SetWizardMenuTab): void {
        patchState({
            wizardMenuTab: tabMenu,
        });
    }
    @Action(SetMemberRelations)
    SetRelations({ patchState }: StateContext<MemberWizardModel>, { relations }: SetMemberRelations): void {
        patchState({
            relations: relations,
        });
    }
    @Action(SetMemberPayFrequency)
    SetMemberPayFrequency({ patchState }: StateContext<MemberWizardModel>, { payFrequency }: SetMemberPayFrequency): void {
        patchState({
            payFrequency: payFrequency,
        });
    }
    @Action(SetCoverageData)
    SetCoverageData({ patchState }: StateContext<MemberWizardModel>, { coverageData }: SetCoverageData): void {
        patchState({
            coverageData: coverageData,
        });
    }
    @Action(SetCurrentFlow)
    SetCurrentFlow({ patchState }: StateContext<MemberWizardModel>, { flow }: SetCurrentFlow): void {
        patchState({
            currentFlow: flow,
        });
    }
    @Action(SetTotalCost)
    SetTotalCost({ patchState }: StateContext<MemberWizardModel>, { cost }: SetTotalCost): void {
        patchState({
            totalCost: cost,
        });
    }
    @Action(SetPlanYear)
    SetPlanYear({ patchState }: StateContext<MemberWizardModel>, { planYear }: SetPlanYear): void {
        patchState({
            planYear: planYear,
        });
    }
    @Action(SetScenarioObject)
    SetScenarioObject({ patchState }: StateContext<MemberWizardModel>, { scenarioObject }: SetScenarioObject): void {
        patchState({
            scenarioObject: scenarioObject,
        });
    }
    /**
     * Method sets all carriers
     * @param ctx is instance of StateContext<MemberWizardModel>
     * @param allCarriers payload to update in store
     */
    @Action(SetAllCarriersMMP)
    SetAllCarriersMMP(ctx: StateContext<MemberWizardModel>, { stateCode }: SetAllCarriersMMP): Observable<Carrier[]> {
        return this.coreService.getCarriers(stateCode).pipe(
            tap((carriers) => {
                ctx.setState(
                    patch({
                        allCarriers: carriers,
                    }),
                );
            }),
        );
    }
}
