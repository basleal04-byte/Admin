import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEtb(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-ET").format(n);
}

export function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 1)}%`;
}
