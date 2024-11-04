import { Pipe, PipeTransform } from "@angular/core";
import { Observable, of } from "rxjs";
import { MessageCenterFacadeService } from "../services/message-center-facade.service";
import { AdminStatus } from "@empowered/api";

/**
 * Dereferences the status id into the name of the status
 */
@Pipe({
    name: "dereferenceStatus",
})
export class DereferenceStatusPipe implements PipeTransform {
    readonly statusMapping: Map<AdminStatus, string> = new Map<AdminStatus, string>()
            .set("CLOSED" , "Closed")
            .set("IN_RESEARCH" , "In Research")
            .set("NEW" , "New");

    constructor(private readonly messageCenterFacade: MessageCenterFacadeService) {}

    /**
     * Dereferences the id of the status into its name
     *
     * @param adminStatus adminStatus enum to convert
     * @returns the name of the status
     */
    transform(adminStatus: AdminStatus): Observable<string> {
        return of(this.statusMapping.get(adminStatus));
    }
}
