import { CrossBorderRule } from "../../aflac";

export interface LocationReset {
    resetState: string;
    resetCity: string;
    crossBorderRules: CrossBorderRule[];
}
