import { Injectable } from "@angular/core";
import { AflacService, EnrollmentMethodDetail, MemberService, ShoppingService } from "@empowered/api";
import { Observable } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import { MemberProfile } from "@empowered/constants";
import { AppFlowService } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class AflacAlwaysApiService {
    constructor(
        protected readonly aflacService: AflacService,
        protected readonly memberService: MemberService,
        protected readonly shoppingService: ShoppingService,
        protected readonly appFlowService: AppFlowService,
    ) {}

    /**
     * @description Fetches the member info
     * @param {number} memberId
     * @param {number} mpGroup
     * @returns {Observable<MemberInfo | HttpResponse<MemberProfile>>}
     * @memberof AflacAlwaysApiService
     */
    fetchMemberInfo(memberId: number, mpGroup: number): Observable<HttpResponse<MemberProfile>> {
        return this.memberService.getMember(memberId, false, `${mpGroup}`);
    }

    /**
     * @description Fetches the member info
     * @param {number} memberId
     * @param {number} policyNumber
     * @param {number} mpGroupId
     * @param {number} productId
     * @returns {Observable<MemberInfo | HttpResponse<MemberProfile>>}
     * @memberof AflacAlwaysApiService
     */
    fetchPolicy(memberId: number, policyNumber: string, mpGroupId: number, productId: number): Observable<HttpResponse<MemberProfile>> {
        return this.aflacService.policyLookup(memberId, policyNumber, mpGroupId, productId);
    }

    /**
     * @description Fetches the enrollment methods
     * @param {number} mpGroupId
     * @returns {Observable<EnrollmentMethodDetail[]>}
     * @memberof AflacAlwaysApiService
     */
    fetchEnrollmentMethods(mpGroupId: number): Observable<EnrollmentMethodDetail[]> {
        return this.shoppingService.getEnrollmentMethods(mpGroupId);
    }
}
