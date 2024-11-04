import { SharedModule } from "@empowered/shared";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { NgModule } from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { AudienceBuilderContainerComponent } from "./components/audience-builder-container/audience-builder-container.component";
import { AudienceRowComponent } from "./components/audience-row/audience-row.component";
import { NgxsModule } from "@ngxs/store";
// eslint-disable-next-line max-len
import { EmployeeIdAudienceInputComponent } from "./components/audience-rows/employee-id-audience-input/employee-id-audience-input.component";
// eslint-disable-next-line max-len
import { ClassTypeAudienceInputComponent } from "./components/audience-rows/class-type-audience-input/class-type-audience-input.component";
import { MatChipsModule } from "@angular/material/chips";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatCheckboxModule } from "@angular/material/checkbox";
// eslint-disable-next-line max-len
import { EmployeeStatusAudienceInputComponent } from "./components/audience-rows/employee-status-audience-input/employee-status-audience-input.component";
// eslint-disable-next-line max-len
import { RegionTypeAudienceInputComponent } from "./components/audience-rows/region-type-audience-input/region-type-audience-input.component";
import { ProductAudienceInputComponent } from "./components/audience-rows/product-audience-input/product-audience-input.component";
import { BenefitOfferingNgxsStoreModule, AudienceGroupNGXSStoreModule } from "@empowered/ngxs-store";
import { LanguageModule } from "@empowered/language";
import { UiModule } from "@empowered/ui";

@NgModule({
    imports: [
        AudienceGroupNGXSStoreModule,
        BenefitOfferingNgxsStoreModule,
        CommonModule,
        MatFormFieldModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatIconModule,
        MatCheckboxModule,
        SharedModule,
        LanguageModule,
        UiModule,
    ],
    declarations: [
        AudienceBuilderContainerComponent,
        AudienceRowComponent,
        EmployeeIdAudienceInputComponent,
        ClassTypeAudienceInputComponent,
        EmployeeStatusAudienceInputComponent,
        RegionTypeAudienceInputComponent,
        ProductAudienceInputComponent,
    ],
    exports: [AudienceBuilderContainerComponent],
    providers: [DatePipe],
})
export class AudienceGroupBuilderModule {}
