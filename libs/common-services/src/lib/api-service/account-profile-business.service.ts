import { Injectable } from "@angular/core";
import { AccountProfileService, ClassNames, Organization } from "@empowered/api";
import { ADDRESS_OPTIONS } from "@empowered/constants";
import { Observable } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
@Injectable({ providedIn: "root" })
export class AccountProfileBusinessService {
    constructor(private readonly accountProfileService: AccountProfileService) {}
    // TODO: Remove checkFlag added for testing multiple import libs
    // eslint-disable-next-line
    private checkFlag: ADDRESS_OPTIONS;
    /**
     * This function is used to get PEO classes/Departments from accountProfileService.
     * @param mpGroup mpgroup of account
     * @param peoCarrierId PEO specific class id as CarrierId.AFLAC
     * @returns Observable of type ClassName
     */
    getEmployeePEOClasses(mpGroup: string, peoCarrierId: number): Observable<ClassNames[]> {
        // passing mpGroup to getClassTypes api to get class types and based on class type id = 1 we will fetch classes.
        return this.accountProfileService
            .getClassTypes(mpGroup)
            .pipe(
                switchMap((classTypes) =>
                    this.accountProfileService.getClasses(classTypes.find((classType) => classType.carrierId === peoCarrierId).id, mpGroup),
                ),
            );
    }

    /**
     * This function is used to get Organizations/Departments from accountProfileService.
     * @param mpGroup mpgroup of account
     * @param isAflacUSer boolean flag which is true if user is aflac specific.
     * @param corporateString string of "CORPORATE"
     * @param undefinedString string of "UNDEFINED"
     * @returns Observable of type Organization
     */
    getOrganizationData(
        mpGroup: string,
        isAflacUSer: boolean,
        corporateString: string,
        undefinedString: string,
    ): Observable<Organization[]> {
        // passing mpGroup to getOrganizations api to get organizations/Departments.
        let organizations: Organization[] = [];
        return this.accountProfileService.getOrganizations(mpGroup).pipe(
            tap((organizationsResp) => {
                organizations = isAflacUSer
                    ? organizationsResp.map((organization) => {
                        organization.name = organization.name === corporateString ? undefinedString : organization.name;
                        return organization;
                    })
                    : organizationsResp;
            }),
        );
    }
}
