import { Actions } from "./actions.model";
import { NewHireType } from "../enums/new-hire-type.enum";

export interface NewHireRule {
    id: number;
    type: NewHireType;
    actions: Actions[];
    conditions: Actions[];
}
