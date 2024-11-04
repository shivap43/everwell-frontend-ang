import { of } from "rxjs";
export const mockUtilService = {
    copy: () => {},
    getNotificationToolTip: () => "",
    getStringWithLeadingZeroes: (value: string, totalDigitCount: number) => "",
    showWellthieLink: () => "",
    setMpGroup: () => "",
    checkDisableForRole12Functionalities: () => of(""),
    validateZip: (state: string, zipCode: string) => of(true),
    isPastDate: (dateToCheck: string) => of(true),
    getMaskedString: (value: string, totalDigitCount: number) => "",
    getCurrentTimezoneOffsetDate: (value: string) => "10/10/1987",
    formatPhoneNumber: (value: string) => {},
    getNotificationStatus: () => of(true),
};
