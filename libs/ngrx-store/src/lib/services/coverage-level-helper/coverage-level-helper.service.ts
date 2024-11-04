import { Injectable } from "@angular/core";
import { CoverageLevelNames, CoverageLevel } from "@empowered/constants";
import { isLifePlan } from "../plan-offering-helper/plan-offering-helper.service";

/**
 * Get CoverageLevel display name based on product. Commonly used for displaying pricing information.
 *
 * @param coverageLevel {CoverageLevel} - CoverageLevel to display
 * @param productId {number} - id of product that CoverageLevel relates to
 *
 * @returns {CoverageLevelNames} text used to represent CoverageLevel
 */
export const getCoverageLevelDisplayName = (coverageLevel: CoverageLevel, productId?: number | null): CoverageLevelNames =>
    isLifePlan(Number(productId))
        ? // for life plans the coverage level must be displayed as individual
        CoverageLevelNames.INDIVIDUAL_COVERAGE
        : (coverageLevel.name as CoverageLevelNames);

@Injectable({
    providedIn: "root",
})
export class CoverageLevelHelperService {
    /**
     * Get CoverageLevel display name based on product. Commonly used for displaying pricing information.
     *
     * @param coverageLevel {CoverageLevel} - CoverageLevel to display
     * @param productId {number} - id of product that CoverageLevel relates to
     *
     * @returns {CoverageLevelNames} text used to represent CoverageLevel
     */
    getCoverageLevelDisplayName(coverageLevel: CoverageLevel, productId: number): CoverageLevelNames {
        return getCoverageLevelDisplayName(coverageLevel, productId);
    }
}
