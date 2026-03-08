// types/skins.ts
export type SkinType = 'card_back' | 'table' | 'chip' | 'background';

export interface Skin {
  id: string;
  name: string;
  type: SkinType;
  price: number;
  unlocked: boolean;
  preview: string;
  equipped: boolean;
}