import { Pipe, PipeTransform } from "@angular/core";
import { LanguageModel } from "@empowered/api";

@Pipe({
    name: "label",
})
export class LabelFilterPipe implements PipeTransform {
    transform(items: LanguageModel[], searchText: string): string {
        if (!items) {
            return "";
        }
        if (!searchText) {
            return "";
        }
        let value = "";
        items.forEach((element) => {
            if (element.tagName.includes(searchText)) {
                value = element.value;
            }
        });
        return value;
    }
}
