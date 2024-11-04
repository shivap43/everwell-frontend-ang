export interface MemberAddDialogData {
    title: string;
    content: any;
    primaryButton?: Button;
    secondaryButton?: Button;
    memberId?: any;
    mpGroupId?: any;
}

interface Button {
    buttonTitle?: string;
}
