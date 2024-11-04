import { CoverageLevelMigration } from "./coverage-level-migration.model";

export interface PlanReplacement {
    newPlanId: number;
    coverageLevelMigrations: CoverageLevelMigration[];
}
