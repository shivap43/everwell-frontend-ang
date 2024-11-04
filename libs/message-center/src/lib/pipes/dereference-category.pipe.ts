import { Pipe, PipeTransform } from "@angular/core";
import { Observable } from "rxjs";
import { TargetUnit, TargetUnitType } from "@empowered/api";
import { MessageCenterFacadeService } from "../services/message-center-facade.service";
import { filter, map } from "rxjs/operators";

/**
 * Dereferences the TargetUnit specifically for Categories
 */
@Pipe({
    name: "dereferenceCategory",
})
export class DereferenceCategoryPipe implements PipeTransform {
    constructor(private readonly messageCenterFacade: MessageCenterFacadeService) {}

    /**
     * Dereferences the category id into its name
     *
     * @param value The target unit to dereference
     * @returns the name of the category that matches the id
     */
    transform(value: TargetUnit): Observable<string> {
        return this.messageCenterFacade.getCategories().pipe(
            filter(categories => value && value.type === TargetUnitType.CATEGORY),
            map(categories => categories.filter(category => value.ids.indexOf(category.id) !== -1)),
            map(categories =>
                categories.reduce(
                    (accumulator, category) =>
                        accumulator === "" ? category.name : `${accumulator}, ${category.name}`,
                    ""
                )
            )
        );
    }
}
