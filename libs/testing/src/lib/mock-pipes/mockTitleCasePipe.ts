import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "titlecase",
})
export class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Titlecase";
    }
}
