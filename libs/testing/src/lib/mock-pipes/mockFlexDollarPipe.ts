import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "flexDollar",
})
export class mockFlexDollarPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
