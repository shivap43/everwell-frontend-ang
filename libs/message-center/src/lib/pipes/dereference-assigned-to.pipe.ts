import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { MessageCenterFacadeService } from "../services/message-center-facade.service";
import { filter, map } from "rxjs/operators";
import { TitleCasePipe } from "@angular/common";

/**
 * Transforms and admin id into a name
 */
@Pipe({
    name: "dereferenceAssignedTo",
})
export class DereferenceAssignedToPipe implements PipeTransform {
    constructor(
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly titlePipe: TitleCasePipe
    ) {}

    /**
     * Dereferences an ID of an admin into the admin, and then formats the name
     *
     * @param adminId the id of the admin
     * @returns the formatted name of the admin
     */
    transform(adminId: number): Observable<string> {
        return this.messageCenterFacade.getAdmins().pipe(
            filter(admins => Boolean(adminId)),
            map(admins => admins.find(admin => admin.id === adminId)),
            filter(admin => Boolean(admin)),
            map(
                admin =>
                    `${this.titlePipe.transform(admin.name.firstName)} ${this.titlePipe.transform(admin.name.lastName)}`
            )
        );
    }
}
