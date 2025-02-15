/**
 * Authentication API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: 0.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Credential } from "@empowered/constants";

export interface TpiSsoResponse {
    credential?: Credential;
    /**
     * the style theme determined by the third party partner
     */
    theme?: string;
    /**
     * absolute URI
     */
    keepalive?: string;
    modal?: boolean;
    planId?: number;
    productId?: number;
}
