import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  var persistentUserProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    persistentUserProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    persistentUserProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    persistentUserProfiles.add(caller, profile);
  };

  // Employee Management
  public type Employee = {
    id : Nat;
    name : Text;
    phoneNo : Text;
  };

  var employees = Map.empty<Nat, Employee>();
  var nextEmployeeId = 1;

  public shared ({ caller }) func addEmployee(name : Text, phoneNo : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add employees");
    };

    let employeeId = nextEmployeeId;
    nextEmployeeId += 1;

    let employee : Employee = {
      id = employeeId;
      name;
      phoneNo;
    };

    employees.add(employeeId, employee);
    employeeId;
  };

  public query ({ caller }) func listEmployees() : async [Employee] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view employees");
    };
    employees.values().toArray();
  };

  // Order Management
  public type OrderRecord = {
    billNo : Nat;
    timestamp : Time.Time;
    customerName : Text;
    orderType : Text;
    material : Text;
    materialDescription : Text;
    palletType : Text;
    pickupLocation : Text;
    deliveryAddress : Text;
    deliveryContact : Text;
    netWeight : Int;
    grossWeight : Int;
    cutWeight : Int;
    deliveryDate : Time.Time;
    assignedTo : ?Nat; // Optional Employee ID
  };

  module OrderRecord {
    public func compare(a : OrderRecord, b : OrderRecord) : Order.Order {
      Nat.compare(b.billNo, a.billNo);
    };
  };

  var orders = Map.empty<Nat, OrderRecord>();
  var nextBillNo = 1;

  public shared ({ caller }) func placeOrder(
    customerName : Text,
    orderType : Text,
    material : Text,
    materialDescription : Text,
    palletType : Text,
    pickupLocation : Text,
    deliveryAddress : Text,
    deliveryContact : Text,
    netWeight : Int,
    grossWeight : Int,
    cutWeight : Int,
    assignedTo : ?Nat,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can place orders");
    };

    let billNo = nextBillNo;
    nextBillNo += 1;

    let order : OrderRecord = {
      billNo;
      timestamp = Time.now();
      customerName;
      orderType;
      material;
      materialDescription;
      palletType;
      pickupLocation;
      deliveryAddress;
      deliveryContact;
      netWeight;
      grossWeight;
      cutWeight;
      deliveryDate = 0;
      assignedTo;
    };

    orders.add(billNo, order);
    billNo;
  };

  public shared ({ caller }) func updateOrder(
    billNo : Nat,
    customerName : Text,
    orderType : Text,
    material : Text,
    materialDescription : Text,
    palletType : Text,
    pickupLocation : Text,
    deliveryAddress : Text,
    deliveryContact : Text,
    netWeight : Int,
    grossWeight : Int,
    cutWeight : Int,
    deliveryDate : Time.Time,
    assignedTo : ?Nat,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update orders");
    };

    switch (orders.get(billNo)) {
      case (null) { Runtime.trap("Order not found") };
      case (?existingOrder) {
        let updatedOrder : OrderRecord = {
          billNo;
          timestamp = existingOrder.timestamp;
          customerName;
          orderType;
          material;
          materialDescription;
          palletType;
          pickupLocation;
          deliveryAddress;
          deliveryContact;
          netWeight;
          grossWeight;
          cutWeight;
          deliveryDate;
          assignedTo;
        };
        orders.add(billNo, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrder(billNo : Nat) : async OrderRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    switch (orders.get(billNo)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };
  };

  public query ({ caller }) func getRecentOrders(count : Nat) : async [OrderRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    if (count == 0) { return []; };

    let sortedArray = orders.values().toArray().sort();
    let limit = if (count > sortedArray.size()) { sortedArray.size() } else { count };

    sortedArray.sliceToArray(0, limit);
  };

  public query ({ caller }) func getAllOrders() : async [OrderRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray();
  };

  public type OrderStats = {
    totalOrders : Nat;
    totalNetWeight : Nat;
    totalGrossWeight : Nat;
    totalCutWeight : Nat;
  };

  public query ({ caller }) func getOrderStats() : async OrderStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get order stats");
    };

    var totalNetWeight : Nat = 0;
    var totalGrossWeight : Nat = 0;
    var totalCutWeight : Nat = 0;

    for (order in orders.values()) {
      totalNetWeight += order.netWeight.toNat();
      totalGrossWeight += order.grossWeight.toNat();
      totalCutWeight += order.cutWeight.toNat();
    };

    {
      totalOrders = orders.size();
      totalNetWeight;
      totalGrossWeight;
      totalCutWeight;
    };
  };

  // -- Repair Orders
  public type RepairOrderRecord = {
    date : Time.Time;
    material : Text;
    addedMaterialWeight : Int;
    materialCost : Int;
    makingCharge : Int;
    totalCost : Int;
    deliveryDate : Time.Time;
    assignTo : Text;
    status : Text;
    deliveryStatus : Text;
  };

  var repairOrders = Map.empty<Nat, RepairOrderRecord>();
  var nextRepairId = 1;

  public shared ({ caller }) func createRepairOrder(
    date : Time.Time,
    material : Text,
    addedMaterialWeight : Int,
    materialCost : Int,
    makingCharge : Int,
    totalCost : Int,
    deliveryDate : Time.Time,
    assignTo : Text,
    status : Text,
    deliveryStatus : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create repair orders");
    };

    let repairId = nextRepairId;
    nextRepairId += 1;

    let repairOrder : RepairOrderRecord = {
      date;
      material;
      addedMaterialWeight;
      materialCost;
      makingCharge;
      totalCost;
      deliveryDate;
      assignTo;
      status;
      deliveryStatus;
    };

    repairOrders.add(repairId, repairOrder);
    repairId;
  };

  public shared ({ caller }) func updateRepairOrder(
    repairId : Nat,
    date : Time.Time,
    material : Text,
    addedMaterialWeight : Int,
    materialCost : Int,
    makingCharge : Int,
    totalCost : Int,
    deliveryDate : Time.Time,
    assignTo : Text,
    status : Text,
    deliveryStatus : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update repair orders");
    };

    switch (repairOrders.get(repairId)) {
      case (null) { Runtime.trap("Repair order not found") };
      case (?_) {
        let updatedRepairOrder : RepairOrderRecord = {
          date;
          material;
          addedMaterialWeight;
          materialCost;
          makingCharge;
          totalCost;
          deliveryDate;
          assignTo;
          status;
          deliveryStatus;
        };
        repairOrders.add(repairId, updatedRepairOrder);
      };
    };
  };

  public query ({ caller }) func getRepairOrder(repairId : Nat) : async RepairOrderRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view repair orders");
    };

    switch (repairOrders.get(repairId)) {
      case (null) { Runtime.trap("Repair order not found") };
      case (?repairOrder) { repairOrder };
    };
  };

  public query ({ caller }) func getRecentRepairOrders(count : Nat) : async [RepairOrderRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view repair orders");
    };

    if (count == 0) { return []; };

    let repairOrdersArray = repairOrders.values().toArray();
    let size = repairOrdersArray.size();
    let limit = if (count > size) { size } else { count };

    repairOrdersArray.sliceToArray(0, limit);
  };

  public query ({ caller }) func getAllRepairOrders() : async [RepairOrderRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view repair orders");
    };
    repairOrders.values().toArray();
  };

  public type RepairOrderStats = {
    totalOrders : Nat;
    totalMaterialCost : Nat;
    totalMakingCharge : Nat;
    totalCost : Nat;
  };

  public query ({ caller }) func getRepairOrderStats() : async RepairOrderStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get repair order stats");
    };

    var totalMaterialCost : Nat = 0;
    var totalMakingCharge : Nat = 0;
    var totalCost : Nat = 0;

    for (repairOrder in repairOrders.values()) {
      totalMaterialCost += repairOrder.materialCost.toNat();
      totalMakingCharge += repairOrder.makingCharge.toNat();
      totalCost += repairOrder.totalCost.toNat();
    };

    {
      totalOrders = repairOrders.size();
      totalMaterialCost;
      totalMakingCharge;
      totalCost;
    };
  };

  // Service Records (Piercing and Other)
  public type PiercingServiceRecord = {
    date : Time.Time;
    name : Text;
    phone : Text;
    amount : Int;
    remarks : Text;
  };

  public type OtherServiceRecord = {
    name : Text;
    phone : Text;
    amount : Int;
    remarks : Text;
  };

  var piercingServices = Map.empty<Nat, PiercingServiceRecord>();
  var otherServices = Map.empty<Nat, OtherServiceRecord>();
  var nextServiceId = 1;

  public shared ({ caller }) func addPiercingService(
    date : Time.Time,
    name : Text,
    phone : Text,
    amount : Int,
    remarks : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add services");
    };

    let serviceId = nextServiceId;
    nextServiceId += 1;

    let service : PiercingServiceRecord = {
      date;
      name;
      phone;
      amount;
      remarks;
    };

    piercingServices.add(serviceId, service);
    serviceId;
  };

  public query ({ caller }) func getPiercingService(serviceId : Nat) : async PiercingServiceRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view services");
    };

    switch (piercingServices.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) { service };
    };
  };

  public query ({ caller }) func getRecentPiercingServices(count : Nat) : async [PiercingServiceRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view services");
    };

    if (count == 0) { return []; };

    let size = piercingServices.size();
    let limit = if (count > size) { size } else { count };

    piercingServices.values().toArray().sliceToArray(0, limit);
  };

  public query ({ caller }) func getAllPiercingServices() : async [PiercingServiceRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view services");
    };
    piercingServices.values().toArray();
  };

  public type PiercingStats = {
    totalCount : Nat;
    totalAmount : Nat;
  };

  public query ({ caller }) func getPiercingStats() : async PiercingStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get piercing stats");
    };

    var totalCount = 0;
    var totalAmount : Nat = 0;

    for (service in piercingServices.values()) {
      totalCount += 1;
      totalAmount += service.amount.toNat();
    };

    { totalCount; totalAmount };
  };

  public shared ({ caller }) func addOtherService(
    name : Text,
    phone : Text,
    amount : Int,
    remarks : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add services");
    };

    let serviceId = nextServiceId;
    nextServiceId += 1;

    let service : OtherServiceRecord = {
      name;
      phone;
      amount;
      remarks;
    };

    otherServices.add(serviceId, service);
    serviceId;
  };

  public query ({ caller }) func getOtherService(serviceId : Nat) : async OtherServiceRecord {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view services");
    };

    switch (otherServices.get(serviceId)) {
      case (null) { Runtime.trap("Service not found") };
      case (?service) { service };
    };
  };

  public query ({ caller }) func getRecentOtherServices(count : Nat) : async [OtherServiceRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view services");
    };

    if (count == 0) { return []; };

    let size = otherServices.size();
    let limit = if (count > size) { size } else { count };

    otherServices.values().toArray().sliceToArray(0, limit);
  };

  public query ({ caller }) func getAllOtherServices() : async [OtherServiceRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view services");
    };
    otherServices.values().toArray();
  };

  public type OtherServiceStats = {
    totalCount : Nat;
    totalAmount : Nat;
  };

  public query ({ caller }) func getOtherServiceStats() : async OtherServiceStats {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get other service stats");
    };

    var totalCount = 0;
    var totalAmount : Nat = 0;

    for (service in otherServices.values()) {
      totalCount += 1;
      totalAmount += service.amount.toNat();
    };

    { totalCount; totalAmount };
  };
};

