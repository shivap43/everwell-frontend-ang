import { Pipe, PipeTransform } from "@angular/core";
import { PlanStates } from "@empowered/constants";

@Pipe({
    name: "orderByPipe",
})
export class SortStatesPipe implements PipeTransform {
    transform(data: PlanStates[]): PlanStates[] {
        return data.sort((a: PlanStates, b: PlanStates) => a.abbreviation.localeCompare(b.abbreviation));
    }
}
