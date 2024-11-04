import { Injectable } from "@angular/core";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";
import { StaticService, CoreService } from "@empowered/api";
import { CarrierId, Configuration, RiskClass, Configurations, Gender } from "@empowered/constants";

import * as SharedActions from "./shared.actions";
import { HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { getEntityId, getSerializableError } from "../../ngrx.store.helpers";

@Injectable()
export class SharedEffects {
    loadStates$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SharedActions.loadCountryStates),
            fetch({
                run: (action) =>
                    this.staticService.getStates().pipe(map((countryStates) => SharedActions.loadCountryStatesSuccess({ countryStates }))),

                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    SharedActions.loadCountryStatesFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    loadCities$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SharedActions.loadCities),
            fetch({
                id: (identifiers) => getEntityId(identifiers.stateAbbreviation),
                run: ({ stateAbbreviation }) =>
                    this.staticService.getCities(stateAbbreviation).pipe(
                        map((cities: string[]) =>
                            SharedActions.loadCitiesSuccess({
                                cities: {
                                    identifiers: {
                                        stateAbbreviation,
                                    },
                                    data: cities,
                                },
                            }),
                        ),
                    ),

                onError: ({ stateAbbreviation }, httpErrorResponse: HttpErrorResponse) =>
                    SharedActions.loadCitiesFailure({
                        error: {
                            identifiers: {
                                stateAbbreviation,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    loadCountries$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SharedActions.loadCountries),
            fetch({
                run: () =>
                    this.staticService.getCountries().pipe(map((countries: string[]) => SharedActions.loadCountriesSuccess({ countries }))),

                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    SharedActions.loadCountriesFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    loadGenders$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SharedActions.loadGenders),
            fetch({
                run: () =>
                    // We need to use type assertion since StaticService.getGenders doesn't use enums yet
                    (this.staticService.getGenders() as Observable<Gender[]>).pipe(
                        map((genders: Gender[]) => SharedActions.loadGendersSuccess({ genders })),
                    ),
                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    SharedActions.loadGendersFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    loadCarrierRiskClasses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SharedActions.loadCarrierRiskClasses),
            fetch({
                run: () =>
                    this.coreService
                        .getCarrierRiskClasses(`${CarrierId.AFLAC}`)
                        .pipe(map((riskClasses: RiskClass[]) => SharedActions.loadCarrierRiskClassesSuccess({ riskClasses }))),

                onError: (action, httpErrorResponse: HttpErrorResponse) =>
                    SharedActions.loadCarrierRiskClassesFailure({ error: httpErrorResponse.error }),
            }),
        ),
    );

    loadConfigurations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SharedActions.loadConfigurations),
            fetch({
                id: (identifiers) => getEntityId(identifiers.configurationNameRegex),
                run: ({ configurationNameRegex }) =>
                    // For shared store, we never want to pass mpGroup or memberId since we are always caching
                    // If we need to get configurations for mpGroup/memberId, we shouldn't use this store
                    // Instead use Member or Account store
                    this.staticService.getConfigurations(configurationNameRegex).pipe(
                        map((configurations: Configurations[]) =>
                            SharedActions.loadConfigurationsSuccess({
                                configurations: {
                                    identifiers: {
                                        configurationNameRegex,
                                    },
                                    // The existing Configurations interface doesn't use the existing enums for Configurations,
                                    // so this interface should be used instead
                                    data: configurations as Configuration[],
                                },
                            }),
                        ),
                    ),
                onError: ({ configurationNameRegex }, httpErrorResponse: HttpErrorResponse) =>
                    SharedActions.loadConfigurationsFailure({
                        error: {
                            identifiers: {
                                configurationNameRegex,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );

    constructor(
        private readonly actions$: Actions,
        private readonly staticService: StaticService,
        private readonly coreService: CoreService,
    ) {}
}
