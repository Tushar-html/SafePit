export type UserRole = "admin" | "user";

export interface UserProfile {
  id?: string;
  mineName: string;
  mineLocation: {
    state: string;
    city: string;
    pinCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  firstName: string;
  lastName: string;
  employeeId: string;
  password?: string;
  role: UserRole;
  bloodGroup: string;
  height: string;
  weight: string;
  age: string;
  hasMedicalCondition: boolean;
  medicalConditionDetails: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation?: string;
  };
  profilePictureUrl?: string;
}

export interface CoalMine {
  id: string;
  name: string;
  state: string;
  city: string;
  pinCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  regionName: string;
}

export interface FireHazardModel {
  id: number;
  name: string;
  displayName: string;
  hazardLevel: "High Risk" | "Moderate Risk" | "Critical Risk";
  hazardColorHex: string;
  hazardBadgeColor: string;
  modelType: "methane" | "coal" | "smouldering" | "gob" | "oil" | "sulphide" | "metal_arc";
  lines: string[];
}

