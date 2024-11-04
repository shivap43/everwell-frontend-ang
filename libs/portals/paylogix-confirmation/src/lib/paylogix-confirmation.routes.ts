import { Routes } from "@angular/router";
import { PaylogixPmtLandingPageComponent } from "./paylogix-pmt-landing-page/paylogix-pmt-landing-page.component";

export const PAYLOGIX_CONFIRMATION_ROUTES: Routes = [
    // URL e.g.: /paylogixconfirmation/<groupId>/<memberId>/<ebsPaymentOnFile>?isSuccess=0
    // ebsPaymentOnFile: 1 for payment on file, 0 for payment not saved
    // ebsPaymentOnFile is only needed if isSuccess is successful (1)
    // isSuccess: 1 for success, 0 for error
    {
        path: "**",
        component: PaylogixPmtLandingPageComponent,
    },
];
