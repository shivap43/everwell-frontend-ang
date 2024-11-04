import { Injectable } from "@angular/core";
import { GetShoppingCart } from "../shopping/models/getShoppingCart.model";
import { Observable, BehaviorSubject, of } from "rxjs";
import { Optional, Inject } from "@angular/core";
import { BASE_PATH } from "../variables";
import { Configuration } from "../configuration";
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from "@angular/common/http";
import { ApplicationResponse, FlexDollarModel, GetAncillary } from "@empowered/constants";
import { catchError } from "rxjs/operators";
import { ApplicationResponseBaseType } from "./enums/application-response-base-type.enum";
import { SendReminderMode } from "../member/models";
import { PendingReasonForPdaCompletion } from "../member/enums";

@Injectable({
    providedIn: "root",
})
export class ShoppingCartDisplayService {
    defaultHeaders = new HttpHeaders();
    configuration = new Configuration();
    protected basePath = "/api";
    shoppingCart = new BehaviorSubject<any>({
        locked: false,
        productOfferingsDeclined: [],
        productOfferingsInCart: [],
        recentExpiredCartItemIds: [],
        totalCost: 0,
    });
    data = this.shoppingCart.asObservable();
    private messageSource = new BehaviorSubject("");
    currentMessage = this.messageSource.asObservable();
    private previousPlanSource = new BehaviorSubject("");
    previousPlan = this.previousPlanSource.asObservable();
    private currentPlanSource = new BehaviorSubject("");
    currentPlan = this.currentPlanSource.asObservable();

    constructor(
        protected httpClient: HttpClient,
        @Optional() @Inject(BASE_PATH) basePath: string,
        @Optional() configuration: Configuration,
    ) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    setShoppingCart(shoppingCart: GetShoppingCart): void {
        this.shoppingCart.next(shoppingCart);
    }
    changeMessage(message: string): void {
        this.messageSource.next(message);
    }
    getApplicationResponses(memberId: number, itemId: number, mpGroup: number): Observable<any> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
        };

        return this.httpClient.get<any>(
            `${this.configuration.basePath}/members/${memberId}/shoppingCart/items/${itemId}/responses`,
            httpOptions,
        );
    }

    setPlanName(previousPlanSource: string, currentPlanSource: string): void {
        this.previousPlanSource.next(previousPlanSource);
        this.currentPlanSource.next(currentPlanSource);
    }

    /**
     * save application response
     * @param memberId member id
     * @param itemId cart item id
     * @param mpGroup map group
     * @param applicationResponse application response payload
     * @param applicationResponseBaseType application response base type
     * @returns Observable of application response
     */
    saveApplicationResponse(
        memberId: number,
        itemId: number,
        mpGroup: number,
        applicationResponse: ApplicationResponse[],
        applicationResponseBaseType?: ApplicationResponseBaseType,
    ): Observable<ApplicationResponse> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",

                // If applicationResponseBaseType has value, append header param base with its value, else do not append
                ...(applicationResponseBaseType && { base: applicationResponseBaseType }),
            },
        };

        return this.httpClient.post<ApplicationResponse>(
            `${this.configuration.basePath}/members/${memberId}/shoppingCart/items/${itemId}/responses`,
            applicationResponse,
            httpOptions,
        );
    }
    emailShoppingCartQuote(memberId: number, mpGroup: number): Observable<unknown> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        const apiEndPoint = this.configuration.basePath + "/members/" + memberId + "/shoppingCart/emailQuote";
        return this.httpClient.post<unknown[]>(
            apiEndPoint,
            {},
            {
                headers: headers,
            },
        );
    }
    getAncillaryInformation(memberId: number, itemId: number, mpGroup: number, planId: number): Observable<GetAncillary> {
        const headers = this.defaultHeaders.set("MP-Group", mpGroup ? mpGroup.toString() : "");
        return this.httpClient.get<GetAncillary>(
            `${this.configuration.basePath}/members/${memberId}/shoppingCart/items/${itemId}/ancillaryInformation?planId=${planId}`,
            { headers },
        );
    }

    /**
     * This method will call post service api to in order to send the reminder for signing the PDA or enrollment
     * @param mpGroup group id for respective account
     * @param memberId member id of the customer
     * @param contactInfo which mode of way user wants to get the reminder
     * @param signatureFor reminder sending from whether document or enrollments
     * @returns Observable<HttpResponse<unknown>>
     */
    requestShoppingCartSignature(
        mpGroup: number,
        memberId: number,
        contactInfo: SendReminderMode,
        signatureFor: PendingReasonForPdaCompletion,
    ): Observable<HttpResponse<void>> {
        const httpOptions = {
            headers: {
                "MP-Group": mpGroup ? mpGroup.toString() : "",
            },
            params: { signatureFor },
        };
        return this.httpClient.post<HttpResponse<void>>(
            `${this.configuration.basePath}/members/${memberId}/shoppingCart/requestSignature`,
            contactInfo,
            httpOptions,
        );
    }

    /**
     * Method to call getAppliedFlexDollarOrIncentivesForCart API
     * @param memberId: member id
     * @param mpGroup : member account group number
     * @param cartItemId: shopping cart item id
     * @returns Observable of FlexDollarModel
     */
    getAppliedFlexDollarOrIncentivesForCart(memberId: number, mpGroup: string, cartItemId?: number): Observable<FlexDollarModel | null> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroup ? mpGroup.toString() : "");
        let params = new HttpParams();
        if (cartItemId) {
            params = params.append("cartItemId", cartItemId.toString());
        }
        return this.httpClient
            .get<FlexDollarModel>(`${this.configuration.basePath}/members/${memberId}/shoppingCart/appliedFlexDollarOrIncentives`, {
                headers: headers,
                params: params,
            })
            .pipe(catchError(() => of(null)));
    }
}
