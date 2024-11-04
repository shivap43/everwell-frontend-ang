import { ResolvedPremium } from "./resolved-premium.model";
import { PendedPremium } from "./pended-premium.model";

export interface PendedBusinessOverview {
    pendedPremiums: PendedPremium[];
    resolvedPremiums: ResolvedPremium[];
}
