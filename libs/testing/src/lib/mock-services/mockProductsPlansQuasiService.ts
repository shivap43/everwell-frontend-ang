import { of } from "rxjs";
import { MatTableDataSource } from "@angular/material/table";
import { ArgusCarrier, Plan, PlanPanel, ArgusADVTiers } from "@empowered/constants";

export const mockProductsPlansQuasiService = {
    getArgusConfigObservableValue: () => of({}),
    defaultSetPerPlan: (allPlans: MatTableDataSource<PlanPanel>) => true,
    loadCarrierRestrictedPlans: (
        selectedCarriers: number[],
        carrierMaps: {
            carrier: string;
            ids: string[];
        }[],
        isRestrictedToSinglePlan: boolean,
        productId: string,
        argusVisionCarrierMaps: ArgusCarrier[],
        argusDentalCarrierMaps: ArgusCarrier[],
        situsState: string,
        eligibleEmployees: number,
        plans: PlanPanel[],
        plansToCompare: PlanPanel[],
        allPlans: MatTableDataSource<any>,
        isERSelected?: boolean,
    ) => {},
    setCommonTaxStatus: (plans: PlanPanel[]) => [] as PlanPanel[],
    checkArgusSelectedPlans: (
        argusDentalCarrierMaps: ArgusCarrier[],
        argusVisionCarrierMaps: ArgusCarrier[],
        situsState: string,
        eligibleEmployees: number,
        currentPlanList: PlanPanel[],
        isRestrictedToSinglePlan: boolean,
        selectedCarriers: number[],
        disableArgusTierPlans: {
            planId: { disableStatus: boolean };
        },
        productId: string,
        argusDentalTiers: ArgusADVTiers,
        selectedPlan: PlanPanel,
    ) => void {},
    setDeselectedPlans: (plansList: PlanPanel[], plansToCompare: PlanPanel[], editedPlanChoices: PlanPanel[]) => [] as PlanPanel[],
    getRestrictedPlans: (plans: Plan[], restrictedStatesList: string[], isRole20User: boolean, isCheckbox: boolean) => true,
    resetQuasiObservableValues: () => void {},
    resetQuasiStoreValues: () => void {},
    isAdminLoggedIn: () => true,
};
