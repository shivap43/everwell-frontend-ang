import { CoverageLevelRule } from "./coverage-level-rule.model";

export interface PlanCoverageLevelRules {
    coverageLevelId: number;
    rules: CoverageLevelRule[];
}
