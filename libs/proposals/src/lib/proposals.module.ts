import { MatSelectModule } from "@angular/material/select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MatDialogModule } from "@angular/material/dialog";
import { SharedModule } from "@empowered/shared";
import { PROPOSALS_ROUTE } from "./proposals.routes";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProposalListComponent } from "./proposal-list/proposal-list.component";
import { PreviewProposalComponent } from "./preview-proposal/preview-proposal.component";
import { DeleteProposalComponent } from "./delete-proposal/delete-proposal.component";
import { SendProposalComponent } from "./send-proposal/send-proposal.component";
import { CreateProposalComponent } from "./create-proposal/create-proposal.component";
import { ProposalDetailsComponent } from "./proposal-details/proposal-details.component";
import { ProposalProductDetailsComponent } from "./proposal-product-details/proposal-product-details.component";
import { ProposalPlanDetailsComponent } from "./proposal-plan-details/proposal-plan-details.component";
import { ReviewCompleteProposalComponent } from "./review-complete-proposal/review-complete-proposal.component";
import { RouterModule } from "@angular/router";
import { LanguageModule } from "@empowered/language";
import { MatTableModule } from "@angular/material/table";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { EmpStepperModule } from "@empowered/emp-stepper";
import { ProposalNoPlansSelectedComponent } from "./proposal-no-plans-selected/proposal-no-plans-selected.component";
import { DeductionFrequencyComponent } from "./deduction-frequency/deduction-frequency.component";
import { BenefitOfferingNgxsStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";
import { NgxMaskModule } from "ngx-mask";
import { AccountListNgxsStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { ProposalStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        ProposalStoreModule,
        NgxMaskModule.forRoot(),
        BenefitOfferingNgxsStoreModule,
        RouterModule.forChild(PROPOSALS_ROUTE),
        SharedModule,
        LanguageModule,
        MatDialogModule,
        MatTableModule,
        MatBottomSheetModule,
        MatDatepickerModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        EmpStepperModule,
        UiModule,
        AccountListNgxsStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        ProposalListComponent,
        PreviewProposalComponent,
        DeleteProposalComponent,
        SendProposalComponent,
        CreateProposalComponent,
        ProposalDetailsComponent,
        ProposalProductDetailsComponent,
        ProposalPlanDetailsComponent,
        ReviewCompleteProposalComponent,
        ProposalNoPlansSelectedComponent,
        DeductionFrequencyComponent,
    ],
})
export class ProposalsModule {}
