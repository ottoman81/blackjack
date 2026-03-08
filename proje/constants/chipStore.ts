// constants/chipStore.ts
import { ChipPackage } from '@/types/user';

export const CHIP_PACKAGES: ChipPackage[] = [
    { id: 'starter_pack', chipAmount: 5000, priceUSD: 1.99, name: 'Başlangıç Paketi' },
    { id: 'value_pack', chipAmount: 15000, priceUSD: 4.99, name: 'Değer Paketi' },
    { id: 'pro_pack', chipAmount: 50000, priceUSD: 14.99, name: 'Profesyonel Paket' },
    { id: 'mega_pack', chipAmount: 200000, priceUSD: 49.99, name: 'Mega Paket' },
];