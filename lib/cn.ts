export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export function commissionValue(promoPrice: number, pct: number): number {
  return (promoPrice * pct) / 100;
}

export function cn2(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
