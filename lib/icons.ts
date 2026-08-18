import {
  Utensils, Bus, Home, Smartphone, GraduationCap, Film, ShoppingBag, 
  Heart, CreditCard, MoreHorizontal, Banknote, Briefcase, Tag, 
  ArrowRightLeft, Gift, CircleDollarSign, CircleHelp
} from 'lucide-react'

// Map database string keys to Lucide React components
export const IconMap: Record<string, any> = {
  'utensils': Utensils,
  'bus': Bus,
  'home': Home,
  'smartphone': Smartphone,
  'graduation-cap': GraduationCap,
  'film': Film,
  'shopping-bag': ShoppingBag,
  'heart': Heart,
  'credit-card': CreditCard,
  'more-horizontal': MoreHorizontal,
  'banknote': Banknote,
  'briefcase': Briefcase,
  'tag': Tag,
  'arrow-right-left': ArrowRightLeft,
  'gift': Gift,
  'circle-dollar-sign': CircleDollarSign
}

// Fallback icon helper
export const getIcon = (iconName: string) => {
  return IconMap[iconName] || CircleHelp
}
