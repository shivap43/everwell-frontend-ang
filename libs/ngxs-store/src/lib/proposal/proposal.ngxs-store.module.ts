import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { ProposalProductChoiceState } from "./proposal-product-choice.state";
import { ProposalsState } from "./proposal.state";

@NgModule({
    imports: [NgxsModule.forFeature([ProposalProductChoiceState, ProposalsState])],
})
export class ProposalStoreModule {}
