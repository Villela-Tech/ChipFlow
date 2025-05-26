export type ChipStatus = 'active' | 'inactive';

export type Operator = 'CLARO' | 'VIVO';

export type Category = 'FOR_DELIVERY' | 'BANNED' | 'UNAVAILABLE_ACCESS';

export interface ChipData {
  id?: string;
  number: string;
  status: ChipStatus;
  operator: Operator;
  category: Category;
  cid?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 