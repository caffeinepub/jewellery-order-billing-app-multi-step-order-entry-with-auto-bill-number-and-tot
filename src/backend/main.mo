import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Apply state migration on upgrade
(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  type OrderRecord = {
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
    netWeight : Nat;
    grossWeight : Nat;
    cutWeight : Nat;
    deliveryDate : Time.Time;
  };

  module OrderRecord {
    public func compare(a : OrderRecord, b : OrderRecord) : Order.Order {
      Nat.compare(b.billNo, a.billNo);
    };
  };

  let orders = Map.empty<Nat, OrderRecord>();
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
    netWeight : Nat,
    grossWeight : Nat,
    cutWeight : Nat,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
    netWeight : Nat,
    grossWeight : Nat,
    cutWeight : Nat,
    deliveryDate : Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
        };
        orders.add(billNo, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrder(billNo : Nat) : async OrderRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    switch (orders.get(billNo)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };
  };

  public query ({ caller }) func getRecentOrders(count : Nat) : async [OrderRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };

    orders.values().toArray().sort().sliceToArray(0, count);
  };

  public type OrderStats = {
    totalOrders : Nat;
    totalNetWeight : Nat;
    totalGrossWeight : Nat;
    totalCutWeight : Nat;
  };

  public query ({ caller }) func getOrderStats() : async OrderStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get order stats");
    };

    var totalNetWeight = 0;
    var totalGrossWeight = 0;
    var totalCutWeight = 0;

    for (order in orders.values()) {
      totalNetWeight += order.netWeight;
      totalGrossWeight += order.grossWeight;
      totalCutWeight += order.cutWeight;
    };

    {
      totalOrders = orders.size();
      totalNetWeight;
      totalGrossWeight;
      totalCutWeight;
    };
  };

  // New RepairOrder type and related functionality
  type RepairOrderRecord = {
    date : Time.Time;
    material : Text;
    addedMaterialWeight : Nat;
    materialCost : Nat;
    makingCharge : Nat;
    totalCost : Nat;
    deliveryDate : Time.Time;
    assignTo : Text;
    status : Text;
    deliveryStatus : Text;
  };

  module RepairOrderRecord {
    public func compare(a : RepairOrderRecord, b : RepairOrderRecord) : Order.Order {
      Int.compare(b.date, a.date);
    };
  };

  let repairOrders = Map.empty<Nat, RepairOrderRecord>();
  var nextRepairId = 1;

  public shared ({ caller }) func createRepairOrder(
    date : Time.Time,
    material : Text,
    addedMaterialWeight : Nat,
    materialCost : Nat,
    makingCharge : Nat,
    totalCost : Nat,
    deliveryDate : Time.Time,
    assignTo : Text,
    status : Text,
    deliveryStatus : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
    addedMaterialWeight : Nat,
    materialCost : Nat,
    makingCharge : Nat,
    totalCost : Nat,
    deliveryDate : Time.Time,
    assignTo : Text,
    status : Text,
    deliveryStatus : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view repair orders");
    };

    switch (repairOrders.get(repairId)) {
      case (null) { Runtime.trap("Repair order not found") };
      case (?repairOrder) { repairOrder };
    };
  };

  public query ({ caller }) func getRecentRepairOrders(count : Nat) : async [RepairOrderRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view repair orders");
    };

    repairOrders.values().toArray().sort().sliceToArray(0, count);
  };

  public type RepairOrderStats = {
    totalOrders : Nat;
    totalMaterialCost : Nat;
    totalMakingCharge : Nat;
    totalCost : Nat;
  };

  public query ({ caller }) func getRepairOrderStats() : async RepairOrderStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get repair order stats");
    };

    var totalMaterialCost = 0;
    var totalMakingCharge = 0;
    var totalCost = 0;

    for (repairOrder in repairOrders.values()) {
      totalMaterialCost += repairOrder.materialCost;
      totalMakingCharge += repairOrder.makingCharge;
      totalCost += repairOrder.totalCost;
    };

    {
      totalOrders = repairOrders.size();
      totalMaterialCost;
      totalMakingCharge;
      totalCost;
    };
  };
};
