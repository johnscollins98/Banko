import { IconType } from "react-icons";
import { BiSolidDonateHeart, BiSolidParty } from "react-icons/bi";
import { BsEnvelopePaperFill, BsHouseUpFill } from "react-icons/bs";
import { FaCoffee, FaPhoneAlt, FaRunning, FaShieldAlt } from "react-icons/fa";
import {
  FaBagShopping,
  FaBurger,
  FaCar,
  FaCarrot,
  FaCat,
  FaChurch,
  FaCreditCard,
  FaGasPump,
  FaGift,
  FaHeart,
  FaHouse,
  FaMoneyBill,
  FaPiggyBank,
  FaPizzaSlice,
  FaReceipt,
  FaShirt,
  FaSun,
  FaTrain,
  FaTv,
} from "react-icons/fa6";
import { GiHealthNormal } from "react-icons/gi";
import { IoPricetag } from "react-icons/io5";
import { MdFamilyRestroom, MdPaid, MdSubscriptions } from "react-icons/md";

export interface Accounts {
  accounts: {
    accountUid: string;
    accountType: "PRIMARY" | "ADDITIONAL" | "LOAN" | "FIXED_TERM_DEPOSIT";
    defaultCategory: string;
    currency: string;
    createdAt: string;
    name: string;
  }[];
}

export interface SignedCurrencyAndAmount {
  currency: string;
  minorUnits: number;
}

export interface Transactions {
  feedItems: {
    feedItemUid: string;
    counterPartyName: string;
    spendingCategory: SpendingCategory;
    reference: string;
    transactionTime: string;
    amount: SignedCurrencyAndAmount;
    direction: "IN" | "OUT";
    status:
      | "UPCOMING"
      | "UPCOMING_CANCELLED"
      | "PENDING"
      | "REVERSED"
      | "SETTLED"
      | "DECLINED"
      | "REFUNDED"
      | "RETRYING"
      | "ACCOUNT_CHECK";
  }[];
}

export interface Balance {
  effectiveBalance: SignedCurrencyAndAmount;
  clearedBalance: SignedCurrencyAndAmount;
}

export const SPENDING_CATEGORIES = [
  "BIKE",
  "BILLS_AND_SERVICES",
  "BUCKET_LIST",
  "CAR",
  "CASH",
  "CELEBRATION",
  "CHARITY",
  "CHILDREN",
  "CLOTHES",
  "COFFEE",
  "DEBT_REPAYMENT",
  "DIY",
  "DRINKS",
  "EATING_OUT",
  "EDUCATION",
  "EMERGENCY",
  "ENTERTAINMENT",
  "ESSENTIAL_SPEND",
  "EXPENSES",
  "FAMILY",
  "FITNESS",
  "FUEL",
  "GAMBLING",
  "GAMING",
  "GARDEN",
  "GENERAL",
  "GIFTS",
  "GROCERIES",
  "HOBBY",
  "HOLIDAYS",
  "HOME",
  "IMPULSE_BUY",
  "INCOME",
  "INSURANCE",
  "INVESTMENTS",
  "LIFESTYLE",
  "MAINTENANCE_AND_REPAIRS",
  "MEDICAL",
  "MORTGAGE",
  "NON_ESSENTIAL_SPEND",
  "PAYMENTS",
  "PERSONAL_CARE",
  "PERSONAL_TRANSFERS",
  "PETS",
  "PROJECTS",
  "RELATIONSHIPS",
  "RENT",
  "SAVING",
  "SHOPPING",
  "SUBSCRIPTIONS",
  "TAKEAWAY",
  "TAXI",
  "TRANSPORT",
  "TREATS",
  "WEDDING",
  "WELLBEING",
  "NONE",
  "REVENUE",
  "OTHER_INCOME",
  "CLIENT_REFUNDS",
  "INVENTORY",
  "STAFF",
  "TRAVEL",
  "WORKPLACE",
  "REPAIRS_AND_MAINTENANCE",
  "ADMIN",
  "MARKETING",
  "BUSINESS_ENTERTAINMENT",
  "INTEREST_PAYMENTS",
  "BANK_CHARGES",
  "OTHER",
  "FOOD_AND_DRINK",
  "EQUIPMENT",
  "PROFESSIONAL_SERVICES",
  "PHONE_AND_INTERNET",
  "VEHICLES",
  "DIRECTORS_WAGES",
  "VAT",
  "CORPORATION_TAX",
  "SELF_ASSESSMENT_TAX",
  "INVESTMENT_CAPITAL",
  "TRANSFERS",
  "LOAN_PRINCIPAL",
  "PERSONAL",
  "DIVIDENDS",
] as const;

export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number];

export const CategoryIcons: Partial<Record<SpendingCategory, IconType>> = {
  BILLS_AND_SERVICES: BsEnvelopePaperFill,
  SHOPPING: FaBagShopping,
  GROCERIES: FaCarrot,
  ENTERTAINMENT: FaTv,
  SAVING: FaPiggyBank,
  DEBT_REPAYMENT: FaCreditCard,
  EATING_OUT: FaBurger,
  TAKEAWAY: FaPizzaSlice,
  SUBSCRIPTIONS: MdSubscriptions,
  CASH: FaMoneyBill,
  INCOME: MdPaid,
  LIFESTYLE: FaHeart,
  FITNESS: FaRunning,
  EXPENSES: FaReceipt,
  TRANSPORT: FaTrain,
  FUEL: FaGasPump,
  GIFTS: FaGift,
  HOLIDAYS: FaSun,
  CAR: FaCar,
  WEDDING: FaChurch,
  IMPULSE_BUY: IoPricetag,
  HOME: FaHouse,
  MORTGAGE: BsHouseUpFill,
  CELEBRATION: BiSolidParty,
  CHARITY: BiSolidDonateHeart,
  CLOTHES: FaShirt,
  COFFEE: FaCoffee,
  MEDICAL: GiHealthNormal,
  PETS: FaCat,
  INSURANCE: FaShieldAlt,
  FAMILY: MdFamilyRestroom,
  GENERAL: FaMoneyBill,
  PHONE_AND_INTERNET: FaPhoneAlt,
};
