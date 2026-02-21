import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type UserProfiles = Map.Map<Principal, { name : Text }>;
  type Orders = Map.Map<Nat, {
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
  }>;

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
  type RepairOrders = Map.Map<Nat, RepairOrderRecord>;

  type OldActor = {
    userProfiles : UserProfiles;
    orders : Orders;
    nextBillNo : Nat;
  };

  type NewActor = {
    userProfiles : UserProfiles;
    orders : Orders;
    nextBillNo : Nat;
    repairOrders : RepairOrders;
    nextRepairId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      repairOrders = Map.empty<Nat, RepairOrderRecord>();
      nextRepairId = 1;
    };
  };
};
