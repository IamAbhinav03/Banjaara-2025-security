export type UserRole = "admin" | "volunteer";

export type ExternalType = "participant" | "attendee" | "on-the-spot";

export type ActionType = "gate-in" | "check-in" | "check-out" | "gate-out";

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
  type: ExternalType;
  feePaid: boolean;
  registrationDate: Date;
  lastEntry?: Date;
  lastExit?: Date;
}

export interface ActionLog {
  id: string;
  externalUid: string;
  action: ActionType;
  timestamp: Date;
  volunteerUid: string;
  volunteerName: string;
}

export interface CSVRow {
  bid: string;
  name: string;
  email: string;
  phone: string;
  type: ExternalType;
  feePaid: boolean;
}
