export type UserRole = "admin" | "volunteer";

export type ExternalType = "participant" | "attendee" | "on-the-spot";

export type ActionType =
  | "gate-in"
  | "check-in"
  | "check-out"
  | "gate-out"
  | "payment";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface External {
  bid: string;
  name: string;
  email: string;
  phone: string;
  paymentStatus: string;
  type: ExternalType;
  registrationDate: Date;
  gateIn: boolean;
  gateOut: boolean;
  checkIn: boolean;
  checkOut: boolean;
  insideCampus: boolean;
  lastEntry?: Date;
  lastExit?: Date;
  events: string[];
  status:
    | "not arrived"
    | "gated in"
    | "checked in"
    | "checked out"
    | "gate out";
}

export interface ActionLog {
  id: string;
  externalUid: string;
  action: ActionType;
  timestamp: Date;
  volunteerName: string;
}

export interface CSVRow {
  bid: string;
  name: string;
  email: string;
  phone: string;
  type: ExternalType;
  paymentStatus: string;
  events: string[];
}
