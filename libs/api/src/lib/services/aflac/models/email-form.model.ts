import { PlanSelections } from "./plan-selections.model";
import { QuoteSettings } from "./quote-settings.model";

export interface EmailForm {
    quoteTitle: string;
    email: string;
    notes: string;
    planSelections: PlanSelections[];
    quoteSettings: QuoteSettings;
    partnerAccountType: string;
}
