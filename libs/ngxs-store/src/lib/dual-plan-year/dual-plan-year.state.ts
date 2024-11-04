import { State, Action, StateContext, Selector } from "@ngxs/store";
import { QleOeShopModel } from "./dual-plan-year.model";
import { IsQleShop, SelectedShop, ResetDualPlanYear } from "./dual-plan-year.action";
import { DualPlanYearSettings } from "@empowered/constants";
import { Injectable } from "@angular/core";

export const defaultState: QleOeShopModel = {
    isOpenEnrollmentWindow: false,
    isQleEnrollmentWindow: false,
    selectedShop: null,
    isDualPlanYear: false,
    planYearsData: [],
    qleEventData: [],
    isQleDuringOeEnrollment: false,
    isQleAfterOeEnrollment: false,
    qleYear: null,
    oeYear: null,
    qleCoverageStartDate: null,
    oeCoverageStartDate: null,
    oePlanYear: null,
    qlePlanYear: null,
};

@State<QleOeShopModel>({
    name: "dualPlanYear",
    defaults: defaultState,
})
@Injectable()
export class DualPlanYearState {
    constructor() {}

    /**
     * Selector to get selected shop
     * @param state DualPlanYear state
     * @return {string} selected shop
     */
    @Selector()
    static getSelectedShop(state: QleOeShopModel): string {
        return state.selectedShop;
    }

    /**
     * Selector to get QLE year
     * @param state DualPlanYear state
     * @return {string} QLE year
     */
    @Selector()
    static getQLEYear(state: QleOeShopModel): string {
        return state.qleYear;
    }

    /**
     * Selector to get OE year
     * @param state DualPlanYear state
     * @return {string} OE year
     */
    @Selector()
    static getOEYear(state: QleOeShopModel): string {
        return state.oeYear;
    }

    /**
     * Selector to get dual pla year boolean value
     * @param state DualPlanYear state
     * @return {string} dual plan year value
     */
    @Selector()
    static isDualPlanYear(state: QleOeShopModel): boolean {
        return state.isDualPlanYear;
    }
    /**
     * Selector to get selected shop plan year id
     * @param state DualPlanYear state
     * @return {number[]} Selected array of shop plan year ids
     */
    @Selector()
    static getCurrentPYId(state: QleOeShopModel): number[] {
        const pyId: number[] = [];
        if (state.isDualPlanYear) {
            if (
                (state.selectedShop === DualPlanYearSettings.OE_SHOP || state.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP) &&
                state.oeDualPlanYear.length
            ) {
                state.oeDualPlanYear.forEach((py) => {
                    pyId.push(py.id);
                });
            } else if (
                (state.selectedShop === DualPlanYearSettings.OE_SHOP || state.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP) &&
                state.isQleAfterOeEnrollment
            ) {
                state.oePlanYearData.forEach((py) => {
                    pyId.push(py.id);
                });
            } else {
                state.qleDualPlanYear.forEach((py) => {
                    pyId.push(py.id);
                });
            }
        }
        return pyId;
    }
    /**
     * Action to reset dual plan year state
     * @param context dualPlanYear state context
     */
    @Action(ResetDualPlanYear)
    resetState(context: StateContext<QleOeShopModel>): void {
        context.setState(defaultState);
    }

    /**
     * Action to update QleShop value in state
     * @param context dualPlanYear state context
     * @param payload data to update dualPlanYear state
     */
    @Action(IsQleShop)
    isQleShop(context: StateContext<QleOeShopModel>, { payload }: IsQleShop): void {
        const state = context.getState();
        context.setState({
            ...state,
            ...payload,
        });
    }

    /**
     * Action to update selectedShop value in state
     * @param context dualPlanYear state context
     * @param selectedShop payload to update dualPlanYear state
     */
    @Action(SelectedShop)
    selectedShop(context: StateContext<QleOeShopModel>, { selectedShop }: SelectedShop): void {
        const state = context.getState();
        context.setState({
            ...state,
            selectedShop,
        });
    }
}
