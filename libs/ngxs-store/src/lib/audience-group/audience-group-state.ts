import {
    AccountProfileService,
    ShoppingService,
    MemberService,
    SearchMembers,
    ClassType,
    RegionType,
    Region,
    ClassNames,
} from "@empowered/api";
import { ProductOffering } from "@empowered/constants";
import {
    GetClassTypes,
    GetRegionTypes,
    GetClassName,
    GetRegion,
    GetProductOfferings,
    GetEmployeeIds,
    ResetAudienceGroup,
} from "./audience-group-action";
import { AudienceGroupBuilderStateModel, ClassTypeName, RegionTypeRegion } from "./audience-group-model";
import { State, StateContext, Selector, Action } from "@ngxs/store";
import { Observable, iif, EMPTY, defer } from "rxjs";
import { tap, first } from "rxjs/operators";
import { ResetState } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: AudienceGroupBuilderStateModel = {
    classTypesRequested: false,
    classTypes: [],
    classNames: [],
    regionTypesRequested: false,
    regionTypes: [],
    regions: [],
    productsRequested: false,
    productOfferings: [],
    employeeIdsRequested: false,
    employeeIds: null,
};

@State<AudienceGroupBuilderStateModel>({
    name: "AudienceGroupBuilder",
    defaults: defaultState,
})
@Injectable()
export class AudienceGroupBuilderState {
    constructor(
        private accountProfileService: AccountProfileService,
        private shoppingService: ShoppingService,
        private memberService: MemberService,
    ) {}
    @Selector()
    static getEmployeeIds(state: AudienceGroupBuilderStateModel): SearchMembers {
        return state.employeeIds;
    }

    @Selector()
    static getClassTypes(state: AudienceGroupBuilderStateModel): ClassType[] {
        return state.classTypes;
    }

    @Selector()
    static getClassNames(state: AudienceGroupBuilderStateModel): ClassTypeName[] {
        return state.classNames;
    }

    @Selector()
    static getRegionTypes(state: AudienceGroupBuilderStateModel): RegionType[] {
        return state.regionTypes;
    }

    @Selector()
    static getRegions(state: AudienceGroupBuilderStateModel): RegionTypeRegion[] {
        return state.regions;
    }

    @Selector()
    static getProducts(state: AudienceGroupBuilderStateModel): ProductOffering[] {
        return state.productOfferings;
    }

    @Action(ResetState)
    resetState(context: StateContext<AudienceGroupBuilderStateModel>): void {
        context.setState(defaultState);
    }

    @Action(ResetAudienceGroup)
    resetAudienceGroup(context: StateContext<AudienceGroupBuilderStateModel>): void {
        this.resetState(context);
    }

    @Action(GetClassTypes)
    getClassTypes(state: StateContext<AudienceGroupBuilderStateModel>, { forceRefresh }: GetClassTypes): Observable<ClassType[]> | void {
        if (forceRefresh || !state.getState().classTypesRequested) {
            state.patchState({ classTypesRequested: true });
            return this.accountProfileService.getClassTypes().pipe(tap((resp) => state.patchState({ classTypes: resp })));
        }
    }

    @Action(GetEmployeeIds)
    getEmployeeIds(
        state: StateContext<AudienceGroupBuilderStateModel>,
        { forceRefresh }: GetEmployeeIds,
    ): Observable<SearchMembers | never> {
        return iif(
            // If the request has not happened or needs to be refreshed...
            () => forceRefresh || !state.getState().employeeIdsRequested,
            // ...patch the flag field and make the request
            defer(() => {
                state.patchState({ employeeIdsRequested: true });
                return this.memberService.searchMembers().pipe(
                    tap((resp) => state.patchState({ employeeIds: resp })),
                    first(),
                );
            }),
            // ...otherwise return empty observable
            defer(() => EMPTY),
        );
    }

    @Action(GetClassName)
    getClassName(
        state: StateContext<AudienceGroupBuilderStateModel>,
        { classTypeId, forceRefresh }: GetClassName,
    ): Observable<ClassNames[]> | void {
        if (forceRefresh || state.getState().classNames.filter((className) => className.classTypeId === classTypeId).length === 0) {
            state.patchState({
                classNames: [
                    ...state.getState().classNames.filter((className) => className.classTypeId !== classTypeId),
                    { classTypeId: classTypeId, classNames: [] },
                ],
            });
            return this.accountProfileService.getClasses(classTypeId).pipe(
                tap((resp) =>
                    state.patchState({
                        classNames: [
                            ...state.getState().classNames.filter((className) => className.classTypeId !== classTypeId),
                            { classTypeId: classTypeId, classNames: resp },
                        ],
                    }),
                ),
            );
        }
    }

    @Action(GetRegionTypes)
    getRegionTypes(state: StateContext<AudienceGroupBuilderStateModel>, { forceRefresh }: GetRegionTypes): Observable<RegionType[]> | void {
        if (forceRefresh || !state.getState().regionTypesRequested) {
            state.patchState({ regionTypesRequested: true });
            return this.accountProfileService.getRegionTypes().pipe(tap((resp) => state.patchState({ regionTypes: resp })));
        }
    }

    @Action(GetRegion)
    getRegion(state: StateContext<AudienceGroupBuilderStateModel>, { regionTypeId, forceRefresh }: GetRegion): Observable<Region[]> | void {
        if (forceRefresh || state.getState().regions.filter((region) => region.regionTypeId === regionTypeId).length === 0) {
            const newRegion: RegionTypeRegion = { regionTypeId: regionTypeId, regions: [] };
            state.patchState({
                regions: [
                    ...state.getState().regions.filter((region) => region.regionTypeId !== regionTypeId),
                    { regionTypeId: regionTypeId, regions: [] },
                ],
            });
            return this.accountProfileService.getRegions(regionTypeId).pipe(
                tap((resp) =>
                    state.patchState({
                        regions: [
                            ...state.getState().regions.filter((region) => region.regionTypeId !== regionTypeId),
                            { regionTypeId: regionTypeId, regions: resp },
                        ],
                    }),
                ),
            );
        }
    }

    @Action(GetProductOfferings)
    getProductOfferings(
        context: StateContext<AudienceGroupBuilderStateModel>,
        { forceRefresh }: GetProductOfferings,
    ): void | Observable<ProductOffering[]> {
        if (forceRefresh || !context.getState().productsRequested) {
            context.patchState({ productsRequested: true });
            return this.shoppingService.getProductOfferings().pipe(tap((resp) => context.patchState({ productOfferings: resp })));
        }
    }
}
