import { ConstraintValue } from "./constraint-value-model";

export interface StepConstraints {
    flowId: number;
    constraint: ConstraintValue;
    cartId?: number;
}
