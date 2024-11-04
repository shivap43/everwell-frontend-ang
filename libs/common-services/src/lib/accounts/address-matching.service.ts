import { HttpHeaders, HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable, Optional } from "@angular/core";
import { Configuration, BASE_PATH, CartItem } from "@empowered/api";
import { Address, CarrierId, PersonalAddress, PolicyOwnershipType, ProductOfferingPanel } from "@empowered/constants";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class AddressMatchingService {
    headers = new HttpHeaders();
    configuration = new Configuration();
    protected basePath = "/api";

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

    /**
     * Validates account contact or account producer match
     * @param mpGroupId
     * @param memberId
     * @param personalAddress
     * @returns true if account contact or account producer matches else false
     */
    validateAccountContactOrAccountProducerMatch(
        mpGroupId: number,
        memberId: number,
        personalAddress: PersonalAddress,
    ): Observable<boolean> {
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/contacts/validateAddressMatch`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroupId?.toString() || "");
        return this.httpClient.post<boolean>(apiEndPoint, personalAddress, {
            headers,
        });
    }

    /**
     * Saves account contact or account producer confirmation
     * @param mpGroupId
     * @param memberId
     * @param isAccountContactOrAccountProducer
     * @returns account contact or account producer confirmation
     */
    saveAccountContactOrAccountProducerConfirmation(
        mpGroupId: number,
        memberId: number,
        isAccountContactOrAccountProducer: boolean,
    ): Observable<void> {
        const params = new HttpParams().append("accountContactOrAccountProducerConfirmed", isAccountContactOrAccountProducer);
        const apiEndPoint = `${this.configuration.basePath}/members/${memberId}/contacts/saveAddressMatch`;
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", mpGroupId?.toString() || "");
        return this.httpClient.put<void>(apiEndPoint, "", {
            headers,
            params,
        });
    }

    /**
     * Checks for ai plans in cart
     * @param cartItems
     * @returns true if ai plans in cart
     */
    checkForAiPlansInCart(cartItems: CartItem[], productPlanData: ProductOfferingPanel[]): boolean {
        // checking whether the plans in cart are Aflac individual plans or not
        return cartItems.some((item) =>
            productPlanData.some((product) =>
                product.planOfferings.some(
                    (planOffering) =>
                        planOffering.id === item.planOfferingId &&
                        planOffering.plan.carrierId === CarrierId.AFLAC &&
                        planOffering.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL,
                ),
            ),
        );
    }

    /**
     * Checks if address has been changed
     * @param prevAddress - Previous address
     * @param newAddress - New address
     * @returns boolean - true if address has been changed, false if not
     */
    hasAddressChanged(prevAddress: PersonalAddress | Address, newAddress: PersonalAddress | Address): boolean {
        // Filtering null values
        prevAddress = Object.entries(prevAddress)
            .filter(([, value]) => Boolean(value))
            .reduce((accumulator, [k, v]) => ((accumulator[k] = v), accumulator), {}) as typeof prevAddress;

        newAddress = Object.entries(newAddress)
            .filter(([, value]) => Boolean(value))
            .reduce((accumulator, [k, v]) => ((accumulator[k] = v), accumulator), {}) as typeof newAddress;

        const prevAddressKeys = Object.keys(prevAddress);

        const isSameAddresses =
            prevAddressKeys.length === Object.keys(newAddress).length &&
            prevAddressKeys.every((key) => prevAddress[key] === newAddress[key]);

        return !isSameAddresses;
    }
}
