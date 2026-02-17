import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface OrderStats {
    totalOrders: bigint;
    totalNetWeight: bigint;
    totalCutWeight: bigint;
    totalGrossWeight: bigint;
}
export type Time = bigint;
export interface OrderRecord {
    customerName: string;
    deliveryAddress: string;
    palletType: string;
    netWeight: bigint;
    orderType: string;
    grossWeight: bigint;
    deliveryContact: string;
    timestamp: Time;
    materialDescription: string;
    cutWeight: bigint;
    billNo: bigint;
    material: string;
    pickupLocation: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrder(billNo: bigint): Promise<OrderRecord>;
    getOrderStats(): Promise<OrderStats>;
    getRecentOrders(count: bigint): Promise<Array<OrderRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, orderType: string, material: string, materialDescription: string, palletType: string, pickupLocation: string, deliveryAddress: string, deliveryContact: string, netWeight: bigint, grossWeight: bigint, cutWeight: bigint): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrder(billNo: bigint, customerName: string, orderType: string, material: string, materialDescription: string, palletType: string, pickupLocation: string, deliveryAddress: string, deliveryContact: string, netWeight: bigint, grossWeight: bigint, cutWeight: bigint): Promise<void>;
}
