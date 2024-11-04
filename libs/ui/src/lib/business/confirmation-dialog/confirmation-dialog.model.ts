/* eslint-disable @typescript-eslint/ban-types */
export interface ConfirmationDialogData {
    title: string;
    content: string;
    primaryButton?: Button;
    secondaryButton?: Button;
    profileChangesData?: string[];
    isStandaloneDemographicEnabled?: boolean;
}

interface Button {
    buttonTitle?: string;
    buttonAction?: Function;
}
