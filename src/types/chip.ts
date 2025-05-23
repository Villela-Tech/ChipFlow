export type ChipStatus = 'Disponível' | 'Indisponível';

export type Operator = 'CLARO' | 'VIVO';

export type Category = 'Acesso indisponível' | 'Banido' | 'Para entrega';

export interface ChipData {
  number: string;
  status: ChipStatus;
  operator: Operator;
  category: Category;
  cid?: string;
} 