import { HttpClientXsrfModule } from "@angular/common/http";
import { NgModule, Optional, SkipSelf } from "@angular/core";

import { CsrfService } from "./csrf.service";

@NgModule({
    /* TODO - Cookie logic revisit */
    imports: [
        HttpClientXsrfModule.withOptions({
            cookieName: "X-CSRF-TOKEN",
            headerName: "X-CSRF-TOKEN",
        }),
    ],
    providers: [CsrfService],
})
export class CsrfModule {
    constructor(@Optional() @SkipSelf() parentModule: CsrfModule) {
        if (parentModule) {
            throw new Error("CsrfModule is already loaded. Import in your base AppModule only.");
        }
    }
}
