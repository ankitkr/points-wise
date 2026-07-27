import type { Category } from '@/lib/kb/schema'

// Canonical spend categories — every expense leg maps to one of these, and
// earn-rule accelerators/exclusions reference them by slug.
export const CATEGORIES: Category[] = [
  { slug: 'groceries', name: 'Groceries', root: 'Food', leaf: 'Groceries', sort: 10 },
  { slug: 'dining', name: 'Dining', root: 'Food', leaf: 'Dining', sort: 11 },
  { slug: 'fuel', name: 'Fuel', root: 'Transport', leaf: 'Fuel', sort: 20 },
  { slug: 'commute', name: 'Commute / Ride-hailing', root: 'Transport', leaf: 'Commute', sort: 21 },
  { slug: 'rent', name: 'Rent', root: 'Housing', leaf: 'Rent', sort: 30 },
  { slug: 'utilities', name: 'Utilities', root: 'Housing', leaf: 'Utilities', sort: 31 },
  { slug: 'travel', name: 'Travel', root: 'Travel', sort: 40 },
  { slug: 'travel-portal', name: 'Bank travel portal', root: 'Travel', leaf: 'Portal', sort: 41 },
  { slug: 'shopping', name: 'Shopping', root: 'Shopping', sort: 50 },
  { slug: 'shopping-online', name: 'Online shopping', root: 'Shopping', leaf: 'Online', sort: 51 },
  { slug: 'entertainment', name: 'Entertainment', root: 'Entertainment', sort: 60 },
  { slug: 'health', name: 'Health', root: 'Health', sort: 70 },
  { slug: 'education', name: 'Education', root: 'Personal', leaf: 'Education', sort: 80 },
  { slug: 'wallet', name: 'Wallet load', root: 'Financial', leaf: 'Wallet', sort: 90 },
  { slug: 'insurance', name: 'Insurance', root: 'Financial', leaf: 'Insurance', sort: 91 },
  { slug: 'fees', name: 'Fees & charges', root: 'Financial', leaf: 'Fees', sort: 92 },
  { slug: 'misc', name: 'Miscellaneous', root: 'Misc', sort: 99 },
]
