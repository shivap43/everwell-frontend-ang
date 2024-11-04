export interface MonDialogData {
    title: string;
    content?: string;
    subContent?: string;
    primaryButton?: Button;
    secondaryButton?: Button;
    hideCloseButton?: boolean;
}

interface Button {
    buttonTitle?: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    buttonAction?: Function;
    buttonClass?: string;
}
