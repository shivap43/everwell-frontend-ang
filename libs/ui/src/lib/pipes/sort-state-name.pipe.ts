import { Pipe, PipeTransform } from "@angular/core";
import { PlanStates } from "@empowered/constants";

@Pipe({
    name: "SortStatesNamePipe",
})
export class SortStatesNamePipe implements PipeTransform {
    transform(data: PlanStates[]): PlanStates[] {
        return data.sort((a: PlanStates, b: PlanStates) => a.name.localeCompare(b.name));
    }
}
