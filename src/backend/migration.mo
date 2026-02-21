import Int "mo:core/Int";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  // Old type definitions
  type OldOrderRecord = {
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

  type OldRepairOrderRecord = {
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

  type OldPiercingServiceRecord = {
    date : Time.Time;
    name : Text;
    phone : Text;
    amount : Nat;
    remarks : Text;
  };

  type OldOtherServiceRecord = {
    name : Text;
    phone : Text;
    amount : Nat;
    remarks : Text;
  };

  type OldActor = {
    orders : Map.Map<Nat, OldOrderRecord>;
    repairOrders : Map.Map<Nat, OldRepairOrderRecord>;
    piercingServices : Map.Map<Nat, OldPiercingServiceRecord>;
    otherServices : Map.Map<Nat, OldOtherServiceRecord>;
  };

  // New type definitions (all required fields)
  type NewOrderRecord = {
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

  type NewRepairOrderRecord = {
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

  type NewPiercingServiceRecord = {
    date : Time.Time;
    name : Text;
    phone : Text;
    amount : Int;
    remarks : Text;
  };

  type NewOtherServiceRecord = {
    name : Text;
    phone : Text;
    amount : Int;
    remarks : Text;
  };

  type NewActor = {
    orders : Map.Map<Nat, NewOrderRecord>;
    repairOrders : Map.Map<Nat, NewRepairOrderRecord>;
    piercingServices : Map.Map<Nat, NewPiercingServiceRecord>;
    otherServices : Map.Map<Nat, NewOtherServiceRecord>;
  };

  public func run(old : OldActor) : NewActor {
    let newOrders = old.orders.map<Nat, OldOrderRecord, NewOrderRecord>(
      func(_id, record) {
        { record with netWeight = record.netWeight.toInt(); grossWeight = record.grossWeight.toInt(); cutWeight = record.cutWeight.toInt() };
      }
    );

    let newRepairOrders = old.repairOrders.map<Nat, OldRepairOrderRecord, NewRepairOrderRecord>(
      func(_id, record) {
        { record with addedMaterialWeight = record.addedMaterialWeight.toInt(); materialCost = record.materialCost.toInt(); makingCharge = record.makingCharge.toInt(); totalCost = record.totalCost.toInt() };
      }
    );

    let newPiercingServices = old.piercingServices.map<Nat, OldPiercingServiceRecord, NewPiercingServiceRecord>(
      func(_id, record) {
        { record with amount = record.amount.toInt() };
      }
    );

    let newOtherServices = old.otherServices.map<Nat, OldOtherServiceRecord, NewOtherServiceRecord>(
      func(_id, record) {
        { record with amount = record.amount.toInt() };
      }
    );

    {
      orders = newOrders;
      repairOrders = newRepairOrders;
      piercingServices = newPiercingServices;
      otherServices = newOtherServices;
    };
  };
};
