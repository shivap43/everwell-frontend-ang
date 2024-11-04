import { BehaviorSubject } from "rxjs";

export const mockTpiService = {
    isLinkAndLaunchMode: () => true,
    setStep: (step: number) => void {},
    setIsAgeError: (isAgeError: boolean) => undefined,
    isShopPageFlow$: new BehaviorSubject(false),
};
