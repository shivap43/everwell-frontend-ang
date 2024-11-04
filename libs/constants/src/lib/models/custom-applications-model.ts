import { CustomSection } from "./custom-section-model";

export interface CustomApplication {
    id: number;
    planId: number;
    riderApplicationIds: number[];
    sections: CustomSection[];
}
