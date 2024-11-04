import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subject, combineLatest, of, Observable } from "rxjs";
import { CsrfService } from "@empowered/util/csrf";
import { ActivatedRoute } from "@angular/router";
import { takeUntil, tap, filter, switchMap, catchError } from "rxjs/operators";
import {
    ThirdPartyIntegrationService,
    ProcessTpiEnrollments,
    ThirdPartyEnrollments,
    ThirdPartyRetrievalQueryParamModel,
} from "@empowered/api";
import { HttpErrorResponse } from "@angular/common/http";

const UPDATE_CENSUS_ROUTE_PATH = "updateCensus";
const USER_ENROLLMENTS_ROUTE_PATH = "userEnrollments";
const UPLOAD_TPI_CENSUS_ROUTE_PATH = "testTPICensusUploadXML";
const TPI_RETRIEVAL_ROUTE_PATH = "testTPIRetrieval";
@Component({
    selector: "empowered-tpi-retrieval-census-upload",
    templateUrl: "./tpi-retrieval-census-upload.component.html",
    styleUrls: ["./tpi-retrieval-census-upload.component.scss"],
})
export class TpiRetrievalCensusUploadComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    applicationResponse: string;
    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param csrfService is instance of csrf service
     * @param route is instance of ActivatedRoute
     * @param thirdPartyIntegrationService is instance of ThirdPartyIntegrationService
     */
    constructor(
        private readonly csrfService: CsrfService,
        private readonly route: ActivatedRoute,
        private readonly thirdPartyIntegrationService: ThirdPartyIntegrationService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * use to call @method getRequiredInformation() which will load csrf token, language and get query parameters
     */
    ngOnInit(): void {
        this.getRequiredInformation();
    }

    /**
     * This method is used to load csrf token, get query parameters from the route
     */
    getRequiredInformation(): void {
        combineLatest([this.route.queryParams, this.csrfService.load()])
            .pipe(
                takeUntil(this.unsubscribe$),
                filter(
                    (response) =>
                        this.route &&
                        this.route.snapshot &&
                        this.route.snapshot &&
                        this.route.snapshot.url &&
                        this.route.snapshot.url.length > 0,
                ),
                switchMap((res) => this.getRequiredObservable(this.route.snapshot.url[0].path, res[0])),
                tap((response) => {
                    this.applicationResponse = JSON.stringify(response);
                }),
                catchError((error: HttpErrorResponse) => {
                    this.displayDefaultError(error);
                    return of(error);
                }),
            )
            .subscribe();
    }

    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        if (error && error.error) {
            this.applicationResponse = JSON.stringify(error.error);
        }
    }

    /**
     * This method is used to return required observable based on current path
     * @param currentRoutePath is instance of current route path which is of type string
     * @param queryParams is instance of ThirdPartyRetrievalQueryParamModel and contains all query parameters
     * @returns an observable of type string, null or ThirdPartyEnrollments[] based on current path
     */
    getRequiredObservable(
        currentRoutePath: string,
        queryParams: ThirdPartyRetrievalQueryParamModel,
    ): Observable<string | null | ThirdPartyEnrollments[]> {
        let tpiObservable: Observable<string> | Observable<ThirdPartyEnrollments[]>;
        if (currentRoutePath === UPDATE_CENSUS_ROUTE_PATH) {
            tpiObservable = this.thirdPartyIntegrationService.updateTpiCensus(queryParams.encData);
        } else if (currentRoutePath === USER_ENROLLMENTS_ROUTE_PATH) {
            tpiObservable = this.thirdPartyIntegrationService.getTpiEnrollments(queryParams.encData);
        } else if (currentRoutePath === UPLOAD_TPI_CENSUS_ROUTE_PATH) {
            tpiObservable = this.thirdPartyIntegrationService.processTpiCensus(queryParams.censusXML);
        } else if (currentRoutePath === TPI_RETRIEVAL_ROUTE_PATH) {
            const tpiRetrievalData: ProcessTpiEnrollments = {
                guid: queryParams.guid,
                ssn: queryParams.ssn,
                plan: queryParams.plan,
                product: queryParams.product,
            };
            tpiObservable = this.thirdPartyIntegrationService.processTpiEnrollments(tpiRetrievalData);
        }
        return tpiObservable;
    }
    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
