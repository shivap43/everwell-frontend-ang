import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "coverageName",
})
export class MockCoverageNamePipe implements PipeTransform {
    transform(value: string) {
        return `${value} enrolled`;
    }
}
