import { FormControl, FormGroup, Validators } from "@angular/forms";
import { PlanOfferingWithCartAndEnrollment } from "@empowered/constants";
import { RiderState } from "../../../../services/rider-state/rider-state.model";
import { RiderFormGroup } from "./riders.model";

export const getMockRiderFormGroup = (checked: boolean): RiderFormGroup =>
    new FormGroup({
        riderPlanName: new FormControl(checked, Validators.required),
        coverageLevelName: new FormControl({ value: null, disabled: !checked }, []),
        eliminationPeriodName: new FormControl({ value: null, disabled: !checked }, []),
        benefitAmount: new FormControl({ value: null, disabled: !checked }, []),
    }) as RiderFormGroup;

export const getMockRiderState = (checked: boolean): RiderState =>
    ({
        checked,
        coverageLevelNames: [],
        benefitAmounts: [],
        eliminationPeriodNames: [],
        selectedBenefitAmount: null,
        selectedCoverageLevelName: null,
        selectedEliminationPeriodName: null,
    } as RiderState);

export const MOCK_PLAN_PANEL = {
    planOffering: {
        id: 999,
        plan: {
            id: 777,
            product: {
                id: 888,
            },
            characteristics: [],
        },
    },
} as PlanOfferingWithCartAndEnrollment;
