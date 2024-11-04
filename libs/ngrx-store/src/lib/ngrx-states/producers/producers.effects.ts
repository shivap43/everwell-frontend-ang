import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ProducerInformation, ProducerService } from "@empowered/api";
import { CountryState } from "@empowered/constants";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { fetch } from "@nrwl/angular";
import { map } from "rxjs/operators";

import * as ProducersActions from "./producers.actions";
import { getLicensedStateSetsEntityId, getProducerInformationsEntityId } from "./producers.state";

@Injectable()
export class ProducersEffects {
    loadProducerInformation$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProducersActions.loadProducerInformation),
            fetch({
                id: (identifiers) => getProducerInformationsEntityId(identifiers),
                run: ({ producerId }) =>
                    this.producerService.getProducerInformation(String(producerId)).pipe(
                        map((producerInformation: ProducerInformation) =>
                            ProducersActions.loadProducerInformationSuccess({
                                producerInformationsEntity: { identifiers: { producerId }, data: producerInformation },
                            }),
                        ),
                    ),

                onError: ({ producerId }, httpErrorResponse: HttpErrorResponse) =>
                    ProducersActions.loadProducerInformationFailure({
                        error: { identifiers: { producerId }, data: httpErrorResponse.error },
                    }),
            }),
        ),
    );

    loadAllProducersLicensedStateSet$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ProducersActions.loadAllProducersLicensedStateSet),
            fetch({
                id: (identifiers) => getLicensedStateSetsEntityId(identifiers),
                run: ({ mpGroup }) =>
                    this.producerService.getAllProducersLicensedStates(mpGroup).pipe(
                        map((licensedStates: CountryState[]) =>
                            ProducersActions.loadAllProducersLicensedStateSetSuccess({
                                licensedStateSetsEntity: { identifiers: { mpGroup }, data: licensedStates },
                            }),
                        ),
                    ),

                onError: ({ mpGroup }, httpErrorResponse: HttpErrorResponse) =>
                    ProducersActions.loadAllProducersLicensedStateSetFailure({
                        error: { identifiers: { mpGroup }, data: httpErrorResponse.error },
                    }),
            }),
        ),
    );

    constructor(private readonly actions$: Actions, private readonly producerService: ProducerService) {}
}
