import { Routes } from "@angular/router";
import { PolicyTransactionsComponent } from "./policy-transactions.component";
import { DowngradeAccidentComponent } from "./downgrade-accident/downgrade-accident.component";
import { DowngradeCancerComponent } from "./downgrade-cancer/downgrade-cancer.component";
import { DowngradeDisabilityComponent } from "./downgrade-disability/downgrade-disability.component";
import { ChangeGenderComponent } from "./change-gender/change-gender.component";
import { ChangeAddressComponent } from "./change-address/change-address.component";
import { ChangeNameComponent } from "./change-name/change-name.component";
import { TransferToPayrollComponent } from "./transfer-to-payroll/transfer-to-payroll.component";
import { RemoveRiderComponent } from "./remove-rider/remove-rider.component";
import { RemoveDependentComponent } from "./remove-dependent/remove-dependent.component";
import { TransferToDirectComponent } from "./transfer-to-direct/transfer-to-direct.component";
import { ChangeOccupationalClassComponent } from "./change-occupational-class/change-occupational-class.component";
import { ChangeBeneficiaryComponent } from "./change-beneficiary/change-beneficiary.component";

export const POLICY_TRANSACTIONS_ROUTES: Routes = [
    {
        path: "",
        component: PolicyTransactionsComponent,
        children: [
            { path: "downgrade-accident", component: DowngradeAccidentComponent },
            { path: "downgrade-cancer", component: DowngradeCancerComponent },
            { path: "downgrade-disability", component: DowngradeDisabilityComponent },
            { path: "change-gender", component: ChangeGenderComponent },
            { path: "change-address", component: ChangeAddressComponent },
            { path: "change-name", component: ChangeNameComponent },
            {
                path: "transfer-to-payroll-union-association-billing",
                component: TransferToPayrollComponent,
            },
            { path: "remove-rider", component: RemoveRiderComponent },
            { path: "remove-dependent", component: RemoveDependentComponent },
            { path: "transfer-to-direct-billing", component: TransferToDirectComponent },
            { path: "change-occupational-class", component: ChangeOccupationalClassComponent },
            { path: "change-beneficiary-info", component: ChangeBeneficiaryComponent },
        ],
    },
];
