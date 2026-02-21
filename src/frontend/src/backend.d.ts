import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RepairOrderRecord {
    status: string;
    assignTo: string;
    addedMaterialWeight: bigint;
    date: Time;
    deliveryDate: Time;
    totalCost: bigint;
    deliveryStatus: string;
    materialCost: bigint;
    material: string;
    makingCharge: bigint;
}
export type Time = bigint;
export interface OrderStats {
    totalOrders: bigint;
    totalNetWeight: bigint;
    totalCutWeight: bigint;
    totalGrossWeight: bigint;
}
export interface OrderRecord {
    customerName: string;
    deliveryAddress: string;
    palletType: string;
    netWeight: bigint;
    deliveryDate: Time;
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
export interface RepairOrderStats {
    totalMaterialCost: bigint;
    totalOrders: bigint;
    totalMakingCharge: bigint;
    totalCost: bigint;
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
    createRepairOrder(date: Time, material: string, addedMaterialWeight: bigint, materialCost: bigint, makingCharge: bigint, totalCost: bigint, deliveryDate: Time, assignTo: string, status: string, deliveryStatus: string): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrder(billNo: bigint): Promise<OrderRecord>;
    getOrderStats(): Promise<OrderStats>;
    getRecentOrders(count: bigint): Promise<Array<OrderRecord>>;
    getRecentRepairOrders(count: bigint): Promise<Array<RepairOrderRecord>>;
    getRepairOrder(repairId: bigint): Promise<RepairOrderRecord>;
    getRepairOrderStats(): Promise<RepairOrderStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, orderType: string, material: string, materialDescription: string, palletType: string, pickupLocation: string, deliveryAddress: string, deliveryContact: string, netWeight: bigint, grossWeight: bigint, cutWeight: bigint): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrder(billNo: bigint, customerName: string, orderType: string, material: string, materialDescription: string, palletType: string, pickupLocation: string, deliveryAddress: string, deliveryContact: string, netWeight: bigint, grossWeight: bigint, cutWeight: bigint, deliveryDate: Time): Promise<void>;
    updateRepairOrder(repairId: bigint, date: Time, material: string, addedMaterialWeight: bigint, materialCost: bigint, makingCharge: bigint, totalCost: bigint, deliveryDate: Time, assignTo: string, status: string, deliveryStatus: string): Promise<void>;
}
