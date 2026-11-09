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
  packageType?: "fixed" | "custom";
  allowExtraDiscount?: boolean;
  testsIncluded?: string[];
  discountCapPercent?: number;
  discountCapRupees?: number;
  isBundleEligible?: boolean;
  savings?: number;
  quantity?: number;
  searchAliases?: string[];
};

export type CustomPackageSummary = {
  id: string;
  name: string;
  packageType: "custom";
  testIds: string[];
  tests: Array<{
    id: string;
    name: string;
    price: number;
    mrp: number;
    discountCapPercent?: number;
    discountCapRupees?: number;
    isBundleEligible?: boolean;
  }>;
  subtotal: number;
  referenceTotal: number;
  bundlePercentage: number;
  bundleDiscount: number;
  payableAmount: number;
  totalSavings: number;
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
  referenceTotal?: number;
  realPriceSubtotal?: number;
  subtotal: number;
  bundleSaving?: number;
  discountTotal: number;
  collectionCharge?: number;
  payableAmount: number;
  appliedOffers: OfferBreakdown[];
  freeCollectionThreshold?: number;
  validSavingsAmount?: number;
  savingsPercent?: number;
  priceSnapshot?: unknown;
};

export type BookingOrderPayload = {
  customer: BookingCustomerInput;
  patientAuthId?: string;
  bookingPatients?: BookingPatientInput[];
  familyMembers: FamilyMemberInput[];
  items: BookingCatalogItem[];
  quote: BookingQuote;
  paymentMethod: "online" | "cod";
  priceSnapshot?: unknown;
};

export type AdminMetricCard = {
  title: string;
  value: string;
  note: string;
};
