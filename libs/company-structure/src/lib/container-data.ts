import { InjectionToken } from "@angular/core";
import { ContainerDataModel } from "./shared/models/container-data-model";

export const CONTAINER_DATA = new InjectionToken<ContainerDataModel>("ContainerData");
