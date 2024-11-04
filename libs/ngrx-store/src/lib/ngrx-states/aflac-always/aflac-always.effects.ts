import { Injectable } from "@angular/core";
import { AflacAlwaysService } from "@empowered/api";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as AflacAlwaysActions from "./aflac-always.actions";
import { AflacAlwaysEnrollments } from "@empowered/constants";
import { map } from "rxjs/operators";
import { fetch } from "@nrwl/angular";
import { HttpErrorResponse } from "@angular/common/http";
import { getAflacAlwaysEnrollmentsEntityId } from "./aflac-always.state";
import { getSerializableError } from "../../ngrx.store.helpers";

@Injectable()
export class AflacAlwaysEffects {
    constructor(private readonly actions$: Actions, private readonly aflacAlwaysService: AflacAlwaysService) {}

    loadAflacAlwaysEnrollments$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AflacAlwaysActions.loadAflacAlwaysEnrollments),
            fetch({
                id: (identifiers) => getAflacAlwaysEnrollmentsEntityId(identifiers),
                run: ({ mpGroupId, memberId }) =>
                    this.aflacAlwaysService.getAflacAlwaysEnrollments(mpGroupId, memberId).pipe(
                        map((aflacAlwaysEnrollments: AflacAlwaysEnrollments[]) =>
                            AflacAlwaysActions.loadAflacAlwaysEnrollmentsSuccess({
                                aflacAlwaysEnrollmentsEntity: {
                                    identifiers: {
                                        mpGroupId,
                                        memberId,
                                    },
                                    data: aflacAlwaysEnrollments.sort((a, b) => a.enrollmentId - b.enrollmentId),
                                },
                            }),
                        ),
                    ),
                onError: ({ mpGroupId, memberId }, httpErrorResponse: HttpErrorResponse) =>
                    AflacAlwaysActions.loadAflacAlwaysEnrollmentsFailure({
                        error: {
                            identifiers: {
                                mpGroupId,
                                memberId,
                            },
                            data: getSerializableError(httpErrorResponse.error),
                        },
                    }),
            }),
        ),
    );
}
