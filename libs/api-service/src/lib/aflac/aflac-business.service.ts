/* eslint-disable @typescript-eslint/indent */
import { AccountDetails, AflacService } from "@empowered/api";
import { AccountImportTypes, CoverageLevel, RateSheetCoverageLevelOption, RateSheetPlanSeriesOption } from "@empowered/constants";
import { Injectable } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { forkJoin, Observable } from "rxjs";
import { catchError, defaultIfEmpty, filter, map, switchMap } from "rxjs/operators";
import { StaticUtilService } from "@empowered/ngxs-store";

@Injectable({ providedIn: "root" })
export class AflacBusinessService {
    sitCodeHierarchyList: string = null;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.commissionSplit.addUpdate.column.sitCodeHierarchy",
        "primary.portal.commissionSplit.addUpdate.column.producer",
        "primary.portal.commissionSplit.addUpdate.column.level",
        "primary.portal.commissionSplit.addUpdate.column.writingNumber",
        "primary.portal.commissionSplit.addUpdate.noHierarchyError",
    ]);
    constructor(
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    /**
     * Set header for SIT code hierarchy tooltip
     * @returns string for tool tip header
     */
    getHeaderOfSITCodeHierarchy(): string {
        return `<table role="presentation">
        <tr role="row">
            <td role="columnheader">
            ${this.languageStrings["primary.portal.commissionSplit.addUpdate.column.sitCodeHierarchy"]}
            </td>
        </tr>
        <tr role="row">
            <td role="columnheader">
           <b>${this.languageStrings["primary.portal.commissionSplit.addUpdate.column.producer"]}</b>
            </td>
            <td role="columnheader">
            <b> ${this.languageStrings["primary.portal.commissionSplit.addUpdate.column.level"]}</b>
            </td>
            <td role="columnheader">
            <b>${this.languageStrings["primary.portal.commissionSplit.addUpdate.column.writingNumber"]}</b>
           </td>
         </tr>
        <tbody role="rowgroup"> `;
    }
    /**
     * fetch sit code hierarchy and format to table form
     * @param sitCode
     * @return observable of type string
     */
    getSitCodeHierarchy(sitCode: number): Observable<string> {
        this.sitCodeHierarchyList = "";
        return this.aflacService.getSitCodeHierarchy(sitCode).pipe(
            map((list) => {
                this.sitCodeHierarchyList = "";
                if (list.length) {
                    const header = this.getHeaderOfSITCodeHierarchy();
                    let codeHierarchyList = "";
                    list.forEach((element) => {
                        codeHierarchyList = codeHierarchyList.concat(
                            `<tr role="row">
            <td role="gridcell">${element.producer.name}</td>
            <td role="gridcell">${element.level}</td>
            <td role="gridcell">${element.writingNumber}</td>
          </tr>`,
                        );
                    });
                    const closeTable = `</tbody>
        </table>`;
                    this.sitCodeHierarchyList = this.sitCodeHierarchyList.concat(header, codeHierarchyList, closeTable);
                } else {
                    this.sitCodeHierarchyList = this.languageStrings["primary.portal.commissionSplit.addUpdate.noHierarchyError"];
                }
                return this.sitCodeHierarchyList;
            }),
            catchError((error) => {
                this.sitCodeHierarchyList = this.languageStrings["primary.portal.commissionSplit.addUpdate.noHierarchyError"];
                return this.sitCodeHierarchyList;
            }),
        );
    }

    /**
     * Makes a call to refresh an account based on the account's import type.
     *
     * @param account account's info
     * @returns http request/s to refresh account
     */
    refreshAccountBasedOnImportType(account: AccountDetails): Observable<unknown> {
        const refreshAflacGroupAccount$ = this.aflacService.getAflacGroupRefreshStatus(account.id).pipe(
            filter((status) => status.refreshAllowed && !status.requiresBenefitOfferingRenewal),
            switchMap((status) => this.aflacService.refreshAflacGroupAccount(account.id)),
            defaultIfEmpty(true),
        );
        switch (account.importType) {
            case AccountImportTypes.AFLAC_INDIVIDUAL:
                return this.aflacService.refreshAccount(account.id.toString());
            case AccountImportTypes.AFLAC_GROUP:
                return refreshAflacGroupAccount$;
            default:
                // Shared case
                return forkJoin([this.aflacService.refreshAccount(account.id.toString()), refreshAflacGroupAccount$]);
        }
    }

    /**
     * Get plan series rate sheet options. Filter out Life Policy Fee rider and "Enrolled" coverage level.
     *
     * @param planSeriesId plan series id
     * @param state resident state
     * @param partnerAccountType account type (payroll, direct, etc)
     * @param payrollFrequencyId payroll deduction frequency id
     * @param riskClassId risk class / occupation class id
     * @param zipCode zip code
     * @param sicCode SIC code
     * @param eligibleSubscribers number of eligible members
     * @returns observable of plan series options
     */
    getRateSheetPlanSeriesOptions(
        planSeriesId: number,
        state: string,
        partnerAccountType: string,
        payrollFrequencyId: number,
        riskClassId: number,
        zipCode?: string,
        sicCode?: number,
        eligibleSubscribers?: number,
    ): Observable<RateSheetPlanSeriesOption[]> {
        return this.staticUtilService.cacheConfigValue("user.enrollment.policy_fee_rider_ids").pipe(
            switchMap((riderIdsString) => {
                const riderIds = riderIdsString.split(",").map(Number);
                return this.aflacService
                    .getRateSheetPlanSeriesOptions(
                        planSeriesId,
                        state,
                        partnerAccountType,
                        payrollFrequencyId,
                        riskClassId,
                        zipCode,
                        sicCode,
                        eligibleSubscribers,
                    )
                    .pipe(
                        map((planSeriesOptions) =>
                            planSeriesOptions.map((option) =>
                                option.riders
                                    ? {
                                          ...option,
                                          coverageLevelOptions: this.filterEnrolledCoverageLevel(option.coverageLevelOptions),
                                          riders: option.riders
                                              .filter((rider) => !riderIds.includes(rider.planId))
                                              .map((rider) => ({
                                                  ...rider,
                                                  coverageLevelOptions: this.filterEnrolledCoverageLevel(rider.coverageLevelOptions),
                                              })),
                                      }
                                    : option,
                            ),
                        ),
                    );
            }),
        );
    }

    filterEnrolledCoverageLevel(coverageLevels: RateSheetCoverageLevelOption[]): RateSheetCoverageLevelOption[] {
        // TODO - Handle "Enrolled" coverage level. It should not show up on the UI but be passed to the downloadRateSheet endpoint
        return coverageLevels; // ?.filter((coverageLevel) => coverageLevel.name !== "Enrolled");
    }
}
