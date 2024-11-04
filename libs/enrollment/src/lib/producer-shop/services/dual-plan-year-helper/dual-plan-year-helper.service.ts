import { Injectable } from "@angular/core";
import { MemberQualifyingEvent, PlanYear } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";
import { EnrollmentPeriodData, ShopPeriodType } from "./dual-plan-year-helper.model";
import { DualPlanYearState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

@Injectable({
    providedIn: "root",
})
export class DualPlanYearHelperService {
    constructor(private readonly ngxsStore: Store, private readonly dateService: DateService) {}

    /**
     * gets dual plan year data from NGXS store
     * @returns observable of enrollment period data
     */
    getDualPlanYearData(): Observable<EnrollmentPeriodData> {
        return this.ngxsStore.select(DualPlanYearState);
    }

    /**
     * Gets standard shop period type based on qualifying events and plan years
     * @param qualifyingEvents qualifying events data
     * @param planYears plan years data
     * @returns ShopPeriodType if shop is in OE or QLE or continuous type
     */
    getStandardShopPeriod(qualifyingEvents: MemberQualifyingEvent[], planYears: PlanYear[]): ShopPeriodType {
        // Get current date and remove seconds, milliseconds
        const currentDate = new Date().setHours(0, 0, 0, 0);

        // check for open enrollment
        if (
            planYears.some((planYear) =>
                // When plan year is in open enrollment as of today
                planYear.enrollmentPeriod.expiresAfter
                    ? this.dateService.isBetween(
                        this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting),
                        this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter),
                        currentDate,
                    )
                    : !this.dateService.isBefore(currentDate, this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting)),
            )
        ) {
            return ShopPeriodType.OE_SHOP;
        }
        if (
            qualifyingEvents.some((qualifyingEvent) =>
                // When QLE is in enrollment as of today
                qualifyingEvent.enrollmentValidity.expiresAfter
                    ? this.dateService.isBetween(
                        this.dateService.toDate(qualifyingEvent.enrollmentValidity?.effectiveStarting),
                        this.dateService.toDate(qualifyingEvent.enrollmentValidity?.expiresAfter || new Date()),
                        currentDate,
                    )
                    : !this.dateService.isBefore(
                        currentDate,
                        this.dateService.toDate(qualifyingEvent.enrollmentValidity?.effectiveStarting),
                    ),
            )
        ) {
            return ShopPeriodType.QLE_SHOP;
        }
        return ShopPeriodType.CONTINUOUS_SHOP;
    }
}
