import { AffectedPoliciesComponent } from "./policy-change-request-flow/affected-policies/affected-policies.component";
import { Routes } from "@angular/router";
import { PolicyChangeRequestComponent } from "./policy-change-request.component";
import { FindPolicyHolderComponent } from "./policy-change-request-flow/find-policy-holder/find-policy-holder.component";
import { PolicyChangesComponent } from "./policy-change-request-flow/policy-changes/policy-changes.component";
import { RequestPolicyChangesComponent } from "./policy-change-request-flow/request-policy-changes/request-policy-changes.component";
import { ReviewAndSubmitComponent } from "./policy-change-request-flow/review-and-submit/review-and-submit.component";
import { PolicyChangeRequestListComponent } from "./policy-change-request-list/policy-change-request-list.component";
import { PolicyChangeRequestViewComponent } from "./policy-change-request-view/policy-change-request-view.component";
import { PermissionGuard } from "@empowered/shared";
import { UserPermissionList } from "@empowered/constants";

export const POLICY_CHANGE_REQUEST_ROUTES: Routes = [
    {
        path: "policy-change-request",
        component: PolicyChangeRequestComponent,
        canActivate: [PermissionGuard],
        data: {
            requiredPermission: UserPermissionList.POLICY_CHANGE_REQUEST,
        },
        children: [
            // FIXME - Routes should be human readable
            { path: "find-policy-holder", component: FindPolicyHolderComponent },
            { path: "affected-policies", component: AffectedPoliciesComponent },
            { path: "request-policy-changes", component: RequestPolicyChangesComponent },
            { path: "policy-changes", component: PolicyChangesComponent },
            { path: "review-submit", component: ReviewAndSubmitComponent },
        ],
    },
    {
        path: "",
        component: PolicyChangeRequestListComponent,
        canActivate: [PermissionGuard],
        data: {
            requiredPermission: UserPermissionList.POLICY_CHANGE_REQUEST,
        },
    },
    {
        path: "policy-change-details",
        component: PolicyChangeRequestViewComponent,
        canActivate: [PermissionGuard],
        data: {
            requiredPermission: UserPermissionList.POLICY_CHANGE_REQUEST,
        },
    },
];
