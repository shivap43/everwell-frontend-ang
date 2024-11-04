import { Action, Selector, State, StateContext } from "@ngxs/store";
import {
    SetTPISSODetail,
    SetOfferingState,
    SetTPIProducerId,
    SetTPIShopRoute,
    SetDisabilityEnrollmentRestriction,
    SetAllCarriersTPI,
    SetTPILegalEntityBasedOnState,
} from "./tpi.actions";
import { TPIStateModel } from "./tpi.model";
import { patch } from "@ngxs/store/operators";
import { TpiSSOModel, PlanOffering, MemberContact } from "@empowered/constants";
import { Carrier, CoreService } from "@empowered/api";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { SetUserContactData } from "./tpi.actions";

const defaultState: TPIStateModel = {
    tpiSSODetail: null,
    planOffering: null,
    producerId: 0,
    tpiShopRoute: null,
    allCarriers: [],
    userContactData: null,
};

@State<TPIStateModel>({
    name: "TPIState",
    defaults: defaultState,
})
@Injectable()
export class TPIState {
    constructor(private readonly coreService: CoreService) {}

    @Selector()
    static tpiSsoDetail(state: TPIStateModel): TpiSSOModel {
        return state.tpiSSODetail;
    }

    /**
     * This selector is used to return the current tpi shop route
     * @param state is instance of TPIStateModel
     * @returns the current tpi shop route
     */
    @Selector()
    static tpiShopRoute(state: TPIStateModel): string {
        return state.tpiShopRoute;
    }

    @Selector()
    static getOfferingState(state: TPIStateModel): PlanOffering[] {
        return state.planOffering;
    }

    @Selector()
    static getTPIProducerId(state: TPIStateModel): number {
        return state.producerId;
    }

    /**
     * Returns whether restriction on disability enrollment for call centers is enabled.
     *
     * @param state state model
     * @returns whether disability enrollment for call centers is disabled
     */
    @Selector()
    static getDisabilityEnrollmentRestriction(state: TPIStateModel): boolean {
        return state.callCenterDisabilityEnrollmentRestricted;
    }
    @Selector()
    static GetAllCarriers(state: TPIStateModel): Carrier[] {
        return state.allCarriers;
    }
    /**
     * Gets users personal info
     *
     * @param state state model
     * @returns user data object stored that contains users personal information
     */
    @Selector()
    static GetUserContactData(state: TPIStateModel): MemberContact {
        return state.userContactData;
    }

    @Action(SetTPISSODetail)
    SetTPISSODetail(ctx: StateContext<TPIStateModel>, { tpiSSODetail }: SetTPISSODetail): void {
        ctx.setState(
            patch({
                tpiSSODetail: tpiSSODetail,
            }),
        );
    }

    @Action(SetOfferingState)
    SetOfferingState(ctx: StateContext<TPIStateModel>, { planOffering }: SetOfferingState): void {
        ctx.setState(
            patch({
                planOffering: planOffering,
            }),
        );
    }
    /**
     * This method is used to reset the tpi state with default state
     * @param context is instance of tpi state model
     */
    @Action(ResetState)
    resetState(context: StateContext<TPIStateModel>): void {
        context.setState(defaultState);
    }

    @Action(SetTPIProducerId)
    SetTPIProducerId(ctx: StateContext<TPIStateModel>, { producerId }: SetTPIProducerId): void {
        ctx.setState(
            patch({
                producerId: producerId,
            }),
        );
    }
    /**
     * This method is used to set the current tpi shop route
     * @param ctx is instance of tpi state model
     * @param tpiShopRoute is the current shop route
     */
    @Action(SetTPIShopRoute)
    SetTPIShopRoute(ctx: StateContext<TPIStateModel>, { tpiShopRoute }: SetTPIShopRoute): void {
        ctx.setState(
            patch({
                tpiShopRoute: tpiShopRoute,
            }),
        );
    }

    /**
     * Save whether restriction on disability enrollment for call centers is enabled.
     *
     * @param ctx state context
     * @param param1 callCenterDisabilityEnrollmentRestricted whether restriction on disability enrollment for call centers is enabled
     */
    @Action(SetDisabilityEnrollmentRestriction)
    SetDisabilityEnrollmentRestriction(
        ctx: StateContext<TPIStateModel>,
        { callCenterDisabilityEnrollmentRestricted }: SetDisabilityEnrollmentRestriction,
    ): void {
        ctx.setState(
            patch({
                callCenterDisabilityEnrollmentRestricted,
            }),
        );
    }

    /**
     * Method sets all carriers
     * @param ctx is instance of StateContext<TPIStateModel>
     * @param stateCode get carrier names based on state
     */
    @Action(SetAllCarriersTPI)
    SetAllCarriers(ctx: StateContext<TPIStateModel>, { stateCode }: SetTPILegalEntityBasedOnState): Observable<Carrier[]> {
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

    /**
     * Method sets user data in TPI flow
     * @param ctx is instance of StateContext<TPIStateModel>
     * @param userData payload of users data to update in store
     */
    @Action(SetUserContactData)
    SetUserContactData({ patchState }: StateContext<TPIStateModel>, { userContactData }: SetUserContactData): void {
        patchState({
            userContactData: userContactData,
        });
    }
}
