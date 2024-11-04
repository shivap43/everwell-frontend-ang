import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "spouseFilter",
    pure: false,
})
export class FilterSpousePipe implements PipeTransform {
    transform(items: string[], selection: number[], index: number): string[] {
        let options = [];
        if (selection.length && selection[0] === index) {
            options = items;
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (selection.length && selection[0] !== index) {
                options = items?.filter((item) => item !== "Spouse");
            } else {
                options = items;
            }
        }
        return options;
    }
}
