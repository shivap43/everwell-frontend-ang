import { Pipe, PipeTransform } from "@angular/core";
import { CustomDataFilterConstants } from "@empowered/constants";
import { DateService } from "@empowered/date";

@Pipe({ name: "customDataFilter" })
export class DataFilter implements PipeTransform {
    constructor(private readonly dateService: DateService) {}
    transform(dataList: any[], filterObject: any, isNotification?: boolean): any[] {
        if (!dataList) {
            return []; // if dataList shouldn't passed to the filter then it will return empty array
        }
        if (this.isEmptyObjectValues(filterObject)) {
            return dataList; // if values shouldn't paased in the filter object then it will retur dataList without checking any condition
        }

        return dataList.filter((data) => this.filterAllFieldsData(data, filterObject, isNotification));
    }

    searchAllFieldsFilter(data: any[], filterQueryObject: any, isNotification?: boolean): any {
        const keys = this.getObjectKeys(filterQueryObject); // fetching all keys from the filter object
        let dataMatchedFlag = false,
            countDataMatchedFlag = 0,
            countPropValueFlag = 0;
        // eslint-disable-next-line complexity
        keys.forEach((key) => {
            dataMatchedFlag = false;
            if (
                typeof data[key] === CustomDataFilterConstants.dataTypeString &&
                typeof filterQueryObject[key] === CustomDataFilterConstants.dataTypeString &&
                filterQueryObject[key]
            ) {
                /* if data key value and filter object query key value datatype should be string then
    it will check filter object key value available in the data key value */
                dataMatchedFlag = data[key].toLowerCase().includes(filterQueryObject[key].toLowerCase());
            } else if (
                Array.isArray(data[key]) &&
                typeof filterQueryObject[key] === CustomDataFilterConstants.dataTypeString &&
                filterQueryObject[key]
            ) {
                /* if filter object query key value datatype should be string and data key value should be array then
    it will check filter object query key value available in the data key value */
                // var r = /^a$/;
                /* "affectedPolicyNumbers" property updated in /forms api as an array, if "data[key]" instance of Array
                then need to filter */
                const filterQueryObjInLowerCase = filterQueryObject[key].toLowerCase();
                const dataObj: string = data[key].filter((policyId: string) => policyId.toLowerCase().includes(filterQueryObjInLowerCase));
                dataMatchedFlag = dataObj.toString().toLowerCase().indexOf(filterQueryObjInLowerCase) !== -1;
            } else if (
                typeof data[key] === CustomDataFilterConstants.dataTypeString &&
                Array.isArray(filterQueryObject[key]) &&
                filterQueryObject[key].length !== 0
            ) {
                /* if data key value datatype should be string and filter object query key value should be array then
    it will check data key value available in the filter object key value */
                dataMatchedFlag = filterQueryObject[key].map((x) => x.toLowerCase()).indexOf(data[key].toLowerCase()) !== -1;
            } else if (
                typeof data[key] === CustomDataFilterConstants.dataTypeNumber &&
                typeof filterQueryObject[key] === CustomDataFilterConstants.dataTypeNumber &&
                filterQueryObject[key]
            ) {
                /* if data key value and filter object query key value datatype should be number then
    it will check filter object key value equal to data key value */
                dataMatchedFlag = data[key].toString().includes(filterQueryObject[key].toString());
            } else if (Array.isArray(data[key]) && Array.isArray(filterQueryObject[key]) && filterQueryObject[key].length !== 0) {
                /* if data key value and filter object query key value datatype should be array then
    it will check filter object array value in the data key value array */
                dataMatchedFlag = this.getFilteredArrayResponse(data[key], filterQueryObject[key], isNotification);
            } else if (
                typeof data[key] === CustomDataFilterConstants.dataTypeObject &&
                Array.isArray(filterQueryObject[key]) &&
                filterQueryObject[key].length !== 0
            ) {
                /* if data key value is object and filter object query key value datatype should be array then
    it will check filter object key value equal to data key value */
                dataMatchedFlag = this.getFilteredObjectResponse(data[key], filterQueryObject[key]);
            }
            if (this.getPropFlagStatusCount(filterQueryObject[key])) {
                countPropValueFlag++;
            }
            if (dataMatchedFlag) {
                countDataMatchedFlag++;
            }
        });
        if (countDataMatchedFlag === countPropValueFlag) {
            return true; // if all filter object properties matched then return data object
        }
        return false;
    }

    // It will return matched true if subset of array values matched with the actual array values
    getFilteredArrayResponse(dataArray: any[], filterArray: string[], isNotification?: boolean): boolean {
        return dataArray.some(function (element: any): boolean {
            if (isNotification === true) {
                return filterArray.includes(element.code.id);
            }
            return filterArray.some(function (elem: string): boolean {
                return JSON.stringify(element)
                    .toLowerCase()
                    .includes(typeof elem === CustomDataFilterConstants.dataTypeNumber ? elem : elem.toLowerCase());
            });
        });
    }
    // It will return true if object values matched with the actual array values
    getFilteredObjectResponse(dataObject: any, filterArray: string[]): boolean {
        return filterArray.some(function (elem: string): boolean {
            return JSON.stringify(dataObject)
                .toLowerCase()
                .includes(typeof elem === CustomDataFilterConstants.dataTypeNumber ? elem : elem.toLowerCase());
        });
    }
    // checking each properties value, it's present then return true
    getPropFlagStatusCount(value: any): boolean | undefined {
        if ((Array.isArray(value) && value.length !== 0) || (!Array.isArray(value) && value)) {
            return true;
        }
        return undefined;
    }

    // We are checking all object properties value here. It should return true if did't find any value
    isEmptyObjectValues(filterObject: any): boolean {
        let flag = true;
        if (filterObject) {
            const keys = this.getObjectKeys(filterObject); // fetching all keys from the filter object
            for (const prop of keys) {
                switch (typeof filterObject[prop]) {
                    case CustomDataFilterConstants.dataTypeNumber:
                        if (filterObject[prop] !== 0) {
                            flag = false;
                        }
                        break;
                    case CustomDataFilterConstants.dataTypeString:
                        if (filterObject[prop] !== "") {
                            flag = false;
                        }
                        break;
                    case CustomDataFilterConstants.dataTypeObject:
                        if (Array.isArray(filterObject[prop]) && filterObject[prop].length !== 0) {
                            flag = false;
                        } else if (!Array.isArray(filterObject[prop])) {
                            // It will call recursively for checking all objects property values
                            flag = this.isEmptyObjectValues(filterObject[prop]);
                        }
                        break;
                    default:
                        flag = true;
                }
                if (!flag) {
                    break;
                }
            }
        }
        return flag;
    }

    // We will filter data based on parent object properties
    filterAllFieldsData(data: any, filterObject: any, isNotification?: boolean): boolean {
        const keys = this.getObjectKeys(filterObject);
        let flag = true;
        keys.forEach((element) => {
            switch (element) {
                case CustomDataFilterConstants.searchTextCase:
                    if (!this.freeTextSearch(data, filterObject.freeText)) {
                        flag = false;
                    }
                    break;
                case CustomDataFilterConstants.queryFilterCase:
                    if (
                        !this.isEmptyObjectValues(filterObject.query) &&
                        !this.searchAllFieldsFilter(data, filterObject.query, isNotification)
                    ) {
                        flag = false;
                    }
                    break;
                case CustomDataFilterConstants.rangeFilterCase:
                    if (!this.rangeFilter(data, filterObject.ranges)) {
                        flag = false;
                    }
                    break;
                case CustomDataFilterConstants.strictFieldFilterCase:
                    if (!this.isEmptyObjectValues(filterObject.strictFields) && !this.strictFieldFilter(data, filterObject.strictFields)) {
                        flag = false;
                    }
                    break;
                case "nonTableData":
                    if (!this.isEmptyObjectValues(filterObject.query) && !this.searchAllFieldsFilter(data, filterObject.query)) {
                        flag = false;
                    }
                    break;
                case CustomDataFilterConstants.dateSubmittedFilterCase:
                    if (
                        !this.isEmptyObjectValues(filterObject.dateSubmitted) &&
                        !this.dateSubmittedSearch(data, filterObject.dateSubmitted, CustomDataFilterConstants.dateSubmittedFilterCase)
                    ) {
                        flag = false;
                    }
                    break;
                default:
                    flag = false;
            }
            if (!flag) {
                return flag;
            }
            return undefined;
        });
        return flag;
    }

    /**
     * This method is to check range of the member counts
     * @param data contains an enrollment object
     * @param ranges is an object containing minValue and maxValue
     * @returns range Filter Flag
     */
    rangeFilter(data: any, ranges: any): boolean {
        const keys = this.getObjectKeys(ranges);
        let pcount = keys.length,
            rangeFilterFlag = false;
        keys.forEach((key) => {
            let rangeObjectCount = 0;
            ranges[key].forEach((rangeObj) => {
                if (
                    (rangeObj.minValue &&
                        this.dateService.isBeforeOrIsEqual(data[key], rangeObj.minValue) &&
                        rangeObj.maxValue &&
                        this.dateService.isBeforeOrIsEqual(data[key], rangeObj.maxValue)) ||
                    (!rangeObj.maxValue && this.dateService.getIsAfterOrIsEqual(data[key], rangeObj.minValue)) ||
                    (!rangeObj.minValue && this.dateService.isBeforeOrIsEqual(data[key], rangeObj.maxValue))
                ) {
                    rangeObjectCount++;
                }
            });
            if (rangeObjectCount || ranges[key].length === 0) {
                pcount--;
            }
        });
        if (pcount === 0) {
            rangeFilterFlag = true;
        }
        return rangeFilterFlag;
    }

    // It will check all values of the object if anyone matched with the given string it will return true
    freeTextSearch(dataObj: any, freeText: any): any {
        return this.getObjectKeys(freeText).some((key: any) => {
            if (
                typeof dataObj[key] === CustomDataFilterConstants.dataTypeNumber &&
                typeof freeText[key] === CustomDataFilterConstants.dataTypeNumber
            ) {
                return dataObj[key].includes(freeText[key]);
            }
            if (
                typeof dataObj[key] === CustomDataFilterConstants.dataTypeString &&
                typeof freeText[key] === CustomDataFilterConstants.dataTypeString
            ) {
                return dataObj[key].toLowerCase().includes(freeText[key].toLowerCase());
            }
            /* "affectedPolicyNumbers" property updated in /forms api as an array, if "data[key]" instance of Array
                then need to filter */
            if (Array.isArray(dataObj[key]) && typeof freeText[key] === CustomDataFilterConstants.dataTypeString) {
                const freeTextInLowerCase = freeText[key].toLowerCase();
                const data: string = dataObj[key].filter((policyId: string) => policyId.toLowerCase().includes(freeTextInLowerCase));
                return data.toString().toLowerCase().includes(freeTextInLowerCase);
            }
            return false;
        });
    }

    /**
     * checks if dataObj date is before or after dateSubmitted
     * @param dataObj is an object from dataList array
     * @param dateSubmitted is the object containing start date and end date
     * @param ownProp is the CustomerDataFilterConstant
     * @returns submitted search
     */
    dateSubmittedSearch(dataObj: any, dateSubmitted: any, ownProp: string): any {
        const prop = this.getObjectKeys(dateSubmitted);
        let count = 0;
        prop.forEach((key) => {
            if (dateSubmitted[key]) {
                count++;
            }
        });
        if (count === 2) {
            return (
                this.dateService.getIsAfterOrIsEqual(dataObj[ownProp], dateSubmitted[prop[0]]) &&
                this.dateService.isBeforeOrIsEqual(dataObj[ownProp], dateSubmitted[prop[1]])
            );
        }
        return this.getObjectKeys(dateSubmitted).some((key: any) => {
            if (key === CustomDataFilterConstants.startDateType && dateSubmitted[key]) {
                return this.dateService.checkIsAfter(dataObj[ownProp], dateSubmitted[key]);
            }
            if (key === CustomDataFilterConstants.endDateType && dateSubmitted[key]) {
                return this.dateService.isBefore(dataObj[ownProp], dateSubmitted[key]);
            }
            return undefined;
        });
    }
    strictFieldFilter(dataObj: any, filterStrictFiledObject: any): boolean {
        // fetching data only if id is fully typed
        const propertyCount = this.getObjectKeys(filterStrictFiledObject).length;
        let flag = false;
        let count = 0;
        const keys = this.getObjectKeys(filterStrictFiledObject);
        let countPropValueFlag = 0;

        keys.forEach((key) => {
            flag = false;
            if (typeof dataObj[key] === CustomDataFilterConstants.dataTypeNumber) {
                flag = dataObj[key] === filterStrictFiledObject[key];
            }
            if (typeof dataObj[key] === CustomDataFilterConstants.dataTypeString) {
                flag = dataObj[key].toLowerCase() === filterStrictFiledObject[key].toString().toLowerCase();
            }
            if (Array.isArray(dataObj[key]) && Array.isArray(filterStrictFiledObject[key]) && filterStrictFiledObject[key].length !== 0) {
                flag = dataObj[key].some(function (element: any): boolean {
                    return filterStrictFiledObject[key].some((elem: string) => {
                        if (elem === element) {
                            return true;
                        }
                        return undefined;
                    });
                });
            }

            if (this.getPropFlagStatusCount(filterStrictFiledObject[key])) {
                countPropValueFlag++;
            }

            if (flag) {
                count++;
            }
        });

        if (count === countPropValueFlag) {
            return true;
        }
        return false;
    }
    getObjectKeys(object: any): string[] {
        return Object.getOwnPropertyNames(object); // fetching all keys from the filter object
    }
}
