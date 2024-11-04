import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "summary",
    pure: false,
})
export class SummaryPipe implements PipeTransform {
    transform(value: string, args?: any): string {
        if (!value && !args) {
            return null;
        }
        return value.substr(0, args) + "...";
    }
}
