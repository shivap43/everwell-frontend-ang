import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CensusBusinessService } from "./census";

@NgModule({
    imports: [CommonModule],
    providers: [CensusBusinessService],
})
export class ApiServiceModule {}
