import type { Bank } from '@/lib/kb/schema'

export const BANKS: Bank[] = [
  { slug: 'hdfc', name: 'HDFC Bank', beancountName: 'HDFC' },
  { slug: 'axis', name: 'Axis Bank', beancountName: 'Axis' },
  { slug: 'icici', name: 'ICICI Bank', beancountName: 'ICICI' },
  { slug: 'sbi', name: 'SBI Card', beancountName: 'SBI' },
  { slug: 'amex', name: 'American Express', beancountName: 'Amex' },
  { slug: 'standard-chartered', name: 'Standard Chartered', beancountName: 'StandardChartered' },
  { slug: 'hsbc', name: 'HSBC', beancountName: 'HSBC' },
  { slug: 'indusind', name: 'IndusInd Bank', beancountName: 'IndusInd' },
  { slug: 'au', name: 'AU Small Finance Bank', beancountName: 'AU' },
  { slug: 'idfc-first', name: 'IDFC FIRST Bank', beancountName: 'IDFCFirst' },
  { slug: 'bob', name: 'Bank of Baroda', beancountName: 'BoB' },
]
