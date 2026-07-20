import {
  Gamepad2,
  Tv,
  Wrench,
  Gift,
  Ticket,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Gamepad2,
  Tv,
  Wrench,
  Gift,
  Ticket,
  ShoppingBag,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? ShoppingBag;
}
