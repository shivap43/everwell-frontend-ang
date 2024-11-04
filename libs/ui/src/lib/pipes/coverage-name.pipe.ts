import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "coverageName",
})

// Display "Enrolled" plan coverage level name as "Individual"
export class CoverageNamePipe implements PipeTransform {
    enrolled = "enrolled";
    individual = "Individual";
    transform(value: string): string {
        if (value && value.toLowerCase() === this.enrolled) {
            return this.individual;
        }
        return value;
    }
}
