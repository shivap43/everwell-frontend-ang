import { PlanSelections } from "./plan-selections.model";
import { QuoteSettings } from "./quote-settings.model";

export interface QuoteForm {
    quoteTitle: string;
    planSelections: PlanSelections[];
    quoteSettings: QuoteSettings;
    partnerAccountType: string;
}
