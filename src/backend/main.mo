import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

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
};
