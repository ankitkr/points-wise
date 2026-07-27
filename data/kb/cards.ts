import type { Card, EarnRule } from '@/lib/kb/schema'

// Seed cards with earn rules drawn from PUBLIC sources. Every rule ships
// `verified: false` — an admin confirms the numbers in /admin/kb before
// trusting them. Rules are versioned append-only (effectiveFrom); a rate
// change is a NEW rule row, never an edit of history.

export type SeedCard = { card: Card; rules: EarnRule[] }

export const CARDS: SeedCard[] = [
  {
    card: {
      slug: 'hdfc-infinia',
      bankSlug: 'hdfc',
      name: 'HDFC Infinia',
      beancountName: 'Infinia',
      network: 'visa',
      pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 5, per: 150 },
        accelerators: [
          {
            category: 'travel-portal',
            label: 'SmartBuy portal',
            multiplier: 10,
            monthlyCapPoints: 15000,
            notes: '10x on SmartBuy flights/hotels; 5x on vouchers (model as offers later)',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify against HDFC T&C.',
      },
    ],
  },
  {
    card: {
      slug: 'axis-magnus',
      bankSlug: 'axis',
      name: 'Axis Magnus',
      beancountName: 'Magnus',
      network: 'mastercard',
      pool: { ticker: 'EDGE_MILES', programme: 'Axis EDGE Miles' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-09-01',
        base: { points: 12, per: 200 },
        accelerators: [
          {
            category: 'travel-portal',
            label: 'Travel Edge portal',
            multiplier: 5,
            monthlyCapPoints: 25000,
            notes: '5x on Travel Edge up to ₹2L spend/month (post Sep-2023 devaluation)',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet', 'insurance'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'icici-amazon-pay',
      bankSlug: 'icici',
      name: 'Amazon Pay ICICI',
      beancountName: 'AmazonPay',
      network: 'visa',
      pool: { ticker: 'AMZN_CB', programme: 'Amazon Pay cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          {
            category: 'shopping-online',
            label: 'Amazon.in (Prime)',
            multiplier: 5,
            notes: '5% on Amazon.in for Prime members; 3% non-Prime',
          },
        ],
        exclusions: ['fuel'],
        verified: false,
        notes: 'Cashback card: 1 point = ₹1. Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'sbi-cashback',
      bankSlug: 'sbi',
      name: 'SBI Cashback',
      beancountName: 'Cashback',
      network: 'visa',
      pool: { ticker: 'SBI_CB', programme: 'SBI Cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          {
            category: 'shopping-online',
            label: 'Online spends',
            multiplier: 5,
            monthlyCapPoints: 5000,
            notes: '5% online, cashback capped ₹5,000/statement cycle',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet', 'utilities'],
        verified: false,
        notes: 'Cashback card: 1 point = ₹1. Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-swiggy',
      bankSlug: 'hdfc',
      name: 'Swiggy HDFC',
      beancountName: 'Swiggy',
      network: 'mastercard',
      pool: { ticker: 'SWIGGY_CB', programme: 'Swiggy card cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-07-01',
        base: { points: 1, per: 100 },
        accelerators: [
          {
            category: 'dining',
            label: 'Swiggy app',
            multiplier: 10,
            monthlyCapPoints: 1500,
            notes: '10% on Swiggy (food/Instamart/Dineout), capped ₹1,500/month',
          },
          {
            category: 'shopping-online',
            label: 'Online spends',
            multiplier: 5,
            monthlyCapPoints: 1500,
            notes: '5% online, capped ₹1,500/month',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Cashback card: 1 point = ₹1. Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'axis-atlas',
      bankSlug: 'axis',
      name: 'Axis Atlas',
      beancountName: 'Atlas',
      network: 'visa',
      pool: { ticker: 'EDGE_MILES', programme: 'Axis EDGE Miles' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-04-20',
        base: { points: 2, per: 100 },
        accelerators: [
          {
            category: 'travel',
            label: 'Travel (airlines/hotels/Travel Edge)',
            multiplier: 2.5,
            monthlyCapPoints: 10000,
            notes: '5 EDGE Miles/₹100 on travel up to ₹2L/month, then base',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet', 'insurance'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
]
