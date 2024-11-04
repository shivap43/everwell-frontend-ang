import { TermsConditionsComponent } from "./tpi-main/terms-conditions/terms-conditions.component";
import { FooterNavComponent } from "./tpi-main/footer-nav/footer-nav.component";
import { NgxsModule } from "@ngxs/store";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TPIRoutingModule } from "./tpi-routing.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EnrollmentMethodTpiComponent } from "./tpi-main/enrollment-method-tpi/enrollment-method-tpi.component";
import { SharedModule } from "@empowered/shared";
import { TpiMainComponent } from "./tpi-main/tpi-main.component";
import { TpiContentBodyComponent } from "./tpi-main/tpi-content-body/tpi-content-body.component";
import { TpiNpnSearchComponent } from "./tpi-main/tpi-npn-search/tpi-npn-search.component";
import { PartialCensusComponent } from "./tpi-main/partial-census/partial-census.component";
import { ConsentStatementComponent } from "./tpi-main/consent-statement/consent-statement.component";
import { CommisionSplitComponent } from "./tpi-main/commision-split/commision-split.component";
import { EnrollmentInitiateComponent } from "./tpi-main/enrollment-initiate/enrollment-initiate.component";
import { ConfirmAddressComponent } from "./tpi-main/confirm-address/confirm-address.component";
import { MatDialogModule } from "@angular/material/dialog";
import { TpiApplicationFlowComponent } from "./tpi-main/tpi-application-flow/tpi-application-flow.component";
import { TpiPdaModule } from "./tpi-pda/tpi-pda.module";
import { LanguageModule, ReplaceTagPipe } from "@empowered/language";
import { ExitPlaceholderComponent } from "./tpi-main/exit-placeholder/exit-placeholder.component";
import { ShopOverviewPlaceholderComponent } from "./tpi-main/shop-overview-placeholder/shop-overview-placeholder.component";
import { TpiFooterComponent } from "./tpi-main/tpi-footer/tpi-footer.component";
import { EnrollmentModule } from "@empowered/enrollment";
import { TpiBenefitSummaryComponent } from "./tpi-main/tpi-benefit-summary/tpi-benefit-summary.component";
import { LnlFooterComponent } from "./tpi-main/lnl-footer/lnl-footer.component";
import { PrivacyPolicyComponent } from "./tpi-main/privacy-policy/privacy-policy.component";
import { TpiRetrievalCensusUploadComponent } from "./tpi-retrieval-census-upload/tpi-retrieval-census-upload.component";
import { TpiFooterConsentStatementComponent } from "./tpi-main/tpi-footer-consent-statement/tpi-footer-consent-statement.component";
import { AddressMatchingComponent } from "./tpi-main/address-matching/address-matching.component";
import { TPINGXSStoreModule, EnrollmentMethodNGXSStoreModule, DashboardNgxsStoreModule } from "@empowered/ngxs-store";
import { UiModule } from "@empowered/ui";
import { TpiPrimaryHeaderComponent } from "./tpi-main/tpi-primary-header/tpi-primary-header.component";
import { TpiSecondaryHeaderComponent } from "./tpi-main/tpi-secondary-header/tpi-secondary-header.component";

@NgModule({
    imports: [
        CommonModule,
        TPIRoutingModule,
        FormsModule,
        ReactiveFormsModule,
        SharedModule,
        TPINGXSStoreModule,
        TpiPdaModule,
        MatDialogModule,
        EnrollmentModule,
        LanguageModule,
        UiModule,
        EnrollmentMethodNGXSStoreModule,
        DashboardNgxsStoreModule,
    ],
    declarations: [
        TpiMainComponent,
        TpiContentBodyComponent,
        TpiNpnSearchComponent,
        PartialCensusComponent,
        CommisionSplitComponent,
        EnrollmentMethodTpiComponent,
        ConsentStatementComponent,
        EnrollmentInitiateComponent,
        ConfirmAddressComponent,
        TpiApplicationFlowComponent,
        ExitPlaceholderComponent,
        ShopOverviewPlaceholderComponent,
        TpiFooterComponent,
        TpiBenefitSummaryComponent,
        LnlFooterComponent,
        FooterNavComponent,
        TermsConditionsComponent,
        PrivacyPolicyComponent,
        TpiRetrievalCensusUploadComponent,
        TpiFooterConsentStatementComponent,
        AddressMatchingComponent,
        TpiPrimaryHeaderComponent,
    ],
    exports: [TpiPrimaryHeaderComponent, TpiFooterComponent, LnlFooterComponent, TpiSecondaryHeaderComponent],
    providers: [ReplaceTagPipe],
})
export class TpiModule {}
