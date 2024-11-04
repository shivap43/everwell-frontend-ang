/* eslint-disable no-underscore-dangle */
import { Pipe, PipeTransform } from "@angular/core";
import { MemberListDependent } from "@empowered/constants";

enum Relations {
    SPOUSE = "Spouse",
    CHILD = "Child",
    GRANDCHILD = "Grandchild",
}

@Pipe({
    name: "relations",
})
export class RelationsPipe implements PipeTransform {
    /**
     * Transforms dependents array into appropriate string format for member-list.
     * For eg. 'Spouse', 'Spouse + Child', 'Child', 'Child (2)', 'Spouse + Child (2)'
     *
     * @param dependents member's dependents
     * @returns +-delimited list of relations with the number of dependents
     */
    transform(dependents: MemberListDependent[] = []): string {
        return [Relations.SPOUSE, Relations.CHILD, Relations.GRANDCHILD].reduce((relationsStr, relation) => {
            const relationWithNumberOfDependents = this.getRelationWithNumberOfDependents(
                relation,
                dependents.filter((dependent) => dependent.relation === relation).length,
            );

            return relationsStr && relationWithNumberOfDependents
                ? `${relationsStr} + ${relationWithNumberOfDependents}`
                : relationsStr || relationWithNumberOfDependents;
        }, "");
    }

    /**
     * Returns a string specifying the number of dependents with a relation to the member.
     *
     * @param relation type of relation
     * @param dependents number of dependents with the relation to the member
     * @returns string indicating relation and the number of dependents with that relation to the member
     */
    getRelationWithNumberOfDependents(relation: Relations, numberOfDependents: number): string {
        if (numberOfDependents === 0) {
            return "";
        }
        if (numberOfDependents === 1) {
            return relation;
        }
        return `${relation} (${numberOfDependents})`;
    }
}
