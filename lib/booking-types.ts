export type BookableKind = "package" | "test";

export type BookingCatalogItem = {
  id: string;
  kind: BookableKind;
  slug: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  category: string;
  href: string;
};

export type FamilyMemberInput = {
  id: string;
  fullName: string;
  relationship: string;
  age: string;
  gender: string;
};

export type BookingPatientInput = {
  patientId: string;
  patientType: "self" | "family";
  familyMemberId?: string | null;
  name: string;
  relation: string;
  age?: string;
  dob?: string;
  gender?: string;
  mobile?: string;
  tests: BookingCatalogItem[];
};

export type BookingCustomerInput = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
};

export type OfferBreakdown = {
  code: string;
  title: string;
  discountAmount: number;
  description: string;
};

export type BookingQuote = {
  subtotal: number;
  discountTotal: number;
  payableAmount: number;
  appliedOffers: OfferBreakdown[];
};

export type BookingOrderPayload = {
  customer: BookingCustomerInput;
  patientAuthId?: string;
  bookingPatients?: BookingPatientInput[];
  familyMembers: FamilyMemberInput[];
  items: BookingCatalogItem[];
  quote: BookingQuote;
  paymentMethod: "online" | "cod";
};

export type AdminMetricCard = {
  title: string;
  value: string;
  note: string;
};
