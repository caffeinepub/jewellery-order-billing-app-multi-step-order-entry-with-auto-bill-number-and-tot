import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type UserProfile = {
    name : Text;
  };

  type PersistentUserProfileStore = Map.Map<Principal, UserProfile>;
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
    netWeight : Int;
    grossWeight : Int;
    cutWeight : Int;
    deliveryDate : Time.Time;
  };
  type RepairOrderRecord = {
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
  type PiercingServiceRecord = {
    date : Time.Time;
    name : Text;
    phone : Text;
    amount : Int;
    remarks : Text;
  };
  type OtherServiceRecord = {
    name : Text;
    phone : Text;
    amount : Int;
    remarks : Text;
  };

  type OldActor = {
    persistentUserProfiles : PersistentUserProfileStore;
    orders : Map.Map<Nat, OrderRecord>;
    repairOrders : Map.Map<Nat, RepairOrderRecord>;
    piercingServices : Map.Map<Nat, PiercingServiceRecord>;
    otherServices : Map.Map<Nat, OtherServiceRecord>;
  };

  type NewActor = {
    persistentUserProfiles : PersistentUserProfileStore;
    orders : Map.Map<Nat, OrderRecord>;
    repairOrders : Map.Map<Nat, RepairOrderRecord>;
    piercingServices : Map.Map<Nat, PiercingServiceRecord>;
    otherServices : Map.Map<Nat, OtherServiceRecord>;
  };

  public func run(old : OldActor) : NewActor {
    {
      persistentUserProfiles = old.persistentUserProfiles;
      orders = old.orders;
      repairOrders = old.repairOrders;
      piercingServices = old.piercingServices;
      otherServices = old.otherServices;
    };
  };
};
