import { Injectable } from "@angular/core";
import { EmpoweredModalService } from "@empowered/common-services";
import { AddNewAccountModalComponent } from "../components/add-new-account-modal/add-new-account-modal.component";

@Injectable({
    providedIn: "root",
})
export class AflacAlwaysModalService {
    constructor(private readonly empoweredModalService: EmpoweredModalService) {}

    /**
     * @description Opens the add new account modal
     * @returns void
     * @memberof AflacAlwaysModalService
     */
    openAddNewAccountModal(data: Record<string, unknown> = {}): void {
        this.empoweredModalService.openDialog(AddNewAccountModalComponent, { data });
    }
}
