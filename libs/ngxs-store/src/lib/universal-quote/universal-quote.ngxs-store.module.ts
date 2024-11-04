import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { UniversalQuoteState } from "./universal-quote.state";

@NgModule({
    imports: [NgxsModule.forFeature([UniversalQuoteState])],
})
export class UniversalQuoteNGXSStoreModule {}
