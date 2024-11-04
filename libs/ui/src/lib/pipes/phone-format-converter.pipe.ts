import { Pipe, PipeTransform } from "@angular/core";
import { CompanyCode } from "@empowered/constants";

const PHONE_LENGTH_10 = 10;
const PHONE_LENGTH_11 = 11;
const US_DIALING_CODE = "1";
@Pipe({
    name: "phone",
})

/**
 *  Formats phone number according to country code provided as argument. Defaults to US if none is specified.
 *
 * @param phoneNumber phone number to format
 * @param country country the number belongs to
 * @param includeDialingCode true if the final output should contain the country's dialing code
 * @returns formatted number
 *
 * Example:
 *   <span>{{'11234567890' | phone: 'US'}}</span> => 1-123-456-7890
 *   <span>{{'1234567890' | phone: 'US'}}</span> => 123-456-7890
 *  */
export class PhoneFormatConverterPipe implements PipeTransform {
    static readonly US_PHONE_10_DIGIT = /(\d{3})(\d{3})(\d{4})/;
    static readonly US_PHONE_11_DIGIT = /(\d{1})(\d{3})(\d{3})(\d{4})/;
    transform(phoneNumber: string, country: string = CompanyCode.US, includeDialingCode: boolean = false): string {
        if (phoneNumber && phoneNumber.trim() && country && country === CompanyCode.US) {
            let pattern;
            let newPhoneNumber = phoneNumber.length > PHONE_LENGTH_11 ? phoneNumber.replace(/\D/g, "") : phoneNumber;
            if (includeDialingCode && phoneNumber.length === PHONE_LENGTH_10) {
                newPhoneNumber = US_DIALING_CODE + newPhoneNumber;
            }
            switch (newPhoneNumber.length) {
                case PHONE_LENGTH_10:
                    pattern = PhoneFormatConverterPipe.US_PHONE_10_DIGIT;
                    break;
                case PHONE_LENGTH_11:
                    pattern = PhoneFormatConverterPipe.US_PHONE_11_DIGIT;
                    break;
                default:
                    return phoneNumber;
            }
            return newPhoneNumber.match(pattern).slice(1).join("-");
        }
        return phoneNumber;
    }
}
