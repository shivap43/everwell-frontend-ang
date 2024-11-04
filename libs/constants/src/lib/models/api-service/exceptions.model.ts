import { CountryState } from "../api/state.model";
import { Validity } from "../validity.model";
import { PlanException } from "./plan-exception.model";
import { ProducerUnit } from "./producer-unit.model";

export interface Exceptions {
    id: number;
    type: string;
    plan?: PlanException;
    validity: Validity;
    approvingProducer: ProducerUnit;
    states?: Array<string | CountryState>;
    enrolledCount: number;
    isValid?: boolean;
    planYear?: PlanYear;
    name?: string;
    maxPlans?: number;
    isExpired?: boolean;
    restrictionValue?: number;
}

interface PlanYear {
    planYearId?: number;
    coveragePeriod?: Validity;
}
