/**
 * @export
 * @interface CoverageLevelRule
 */
export interface CoverageLevelRule {
    state: string;
    minDependents: number;
    maxDependents: number;
    coversSpouse: boolean;
    spouseMinAge: number;
    spouseMaxAge: number;
    childMinAge: number;
    childMaxAge: number;
}
