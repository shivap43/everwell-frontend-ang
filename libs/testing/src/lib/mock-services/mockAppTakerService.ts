import { of } from "rxjs";
export const mockAppTakerService = {
    getUnpluggedDownloadURL: () => of(""),
    getMaintananceLock: (mpGroup: string) => of({}),
};
