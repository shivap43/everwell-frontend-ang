import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "phone",
})
export class mockPhoneFormatConverterPipe implements PipeTransform {
    transform(phoneNumber: string, country: string = "US", includeDialingCode: boolean = false) {
        return phoneNumber;
    }
}
