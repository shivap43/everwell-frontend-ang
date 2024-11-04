import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AddressMatchingService } from "./accounts/address-matching.service";

@NgModule({
    imports: [CommonModule],
    providers: [AddressMatchingService],
})
export class CommonServicesModule {}
