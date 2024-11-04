import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { CommonModule, DatePipe, CurrencyPipe } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedStoreModule } from "./+state";
import { UiComponentsModule } from "./ui-components/ui-components.module";
import { OverlayModule } from "@angular/cdk/overlay";
import { NgxMaskPipe, NgxMaskModule } from "ngx-mask";
import { MatBottomSheetModule } from "@angular/material/bottom-sheet";
import { MemberBeneficiaryNgxsStoreModule, PathNgxsStoreModule, ProducerListNgxsStoreModule } from "@empowered/ngxs-store";

@NgModule({
    imports: [
        CommonModule,
        SharedStoreModule,
        UiComponentsModule,
        FormsModule,
        ReactiveFormsModule,
        LanguageModule,
        OverlayModule,
        NgxMaskModule.forRoot(),
        MatBottomSheetModule,
        MemberBeneficiaryNgxsStoreModule,
        PathNgxsStoreModule,
        ProducerListNgxsStoreModule,
    ],
    exports: [CommonModule, FormsModule, ReactiveFormsModule, UiComponentsModule, OverlayModule, DatePipe],
    declarations: [],
    providers: [ReplaceTagPipe, { provide: NgxMaskPipe, useClass: NgxMaskPipe }, DatePipe, CurrencyPipe],
})
export class SharedModule {}
