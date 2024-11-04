import { NgModule } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { ProducerListState } from "./producer-list.state";

@NgModule({
    imports: [NgxsModule.forFeature([ProducerListState])],
})
export class ProducerListNgxsStoreModule {}
