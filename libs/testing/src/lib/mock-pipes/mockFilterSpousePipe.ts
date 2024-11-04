import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "spouseFilter",
})
export class MockFilterSpousePipe implements PipeTransform {
    transform(items: string[], selection: number[], index: number): string[] {
        return ["spouse"];
    }
}
