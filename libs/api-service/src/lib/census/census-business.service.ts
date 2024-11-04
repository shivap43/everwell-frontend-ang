import { Injectable } from "@angular/core";
import { CensusService, BenefitsOfferingService } from "@empowered/api";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class CensusBusinessService {
    constructor(private readonly censusService: CensusService, private readonly benefitsOfferingService: BenefitsOfferingService) {}
    /**
     * This method is used to fetch estimated number of employee value from API
     * This method will create an Observable to fetch, map eligible employee value and returns it
     * @returns an observable of number which contains estimated employee value
     */
    getCensusEstimate(): Observable<number | undefined> {
        return this.benefitsOfferingService.getBenefitOfferingSettings().pipe(map((res) => res.totalEligibleEmployees));
    }
}
