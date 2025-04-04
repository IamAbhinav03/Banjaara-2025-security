export type UserRole = "admin" | "volunteer";

export type ExternalType =
  | "participant"
  | "attendee-day1"
  | "attendee-day2"
  | "attendee-bothdays"
  | "on-the-spot";

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
  college: string;
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
  lastTime: string;
  status:
    | "not arrived"
    | "gated in"
    | "checked in"
    | "checked out"
    | "gate out";
}

export interface CSVRow {
  bid: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  type: ExternalType;
  paymentStatus: string;
  events: string[];
}

export interface ActionLog {
  id: string;
  externalUid: string;
  action: ActionType;
  timestamp: Date;
  volunteerName: string;
}
