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

  // -------------------------------------------------------------------------
  // Owner portfolio additions — rates are public-source approximations,
  // every rule verified:false until an admin confirms against bank T&C.

  {
    card: {
      slug: 'amex-platinum-travel',
      bankSlug: 'amex',
      name: 'Amex Platinum Travel',
      beancountName: 'PlatinumTravel',
      network: 'amex',
      pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 1, per: 50 },
        accelerators: [],
        exclusions: ['fuel', 'insurance', 'utilities'],
        verified: false,
        notes:
          'Milestones (₹1.9L → 15k MR; ₹4L → 25k MR + hotel voucher) are the real value — modelled in M3 as bonus accruals, not per-txn accelerators.',
      },
    ],
  },
  {
    card: {
      slug: 'amex-mrcc',
      bankSlug: 'amex',
      name: 'Amex MRCC',
      beancountName: 'MRCC',
      network: 'amex',
      pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 1, per: 50 },
        accelerators: [],
        exclusions: ['fuel', 'insurance', 'utilities'],
        verified: false,
        notes: 'Monthly milestone bonuses (e.g. 4×₹1.5k txns → 1k MR) modelled in M3 as bonus accruals.',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-bizblack',
      bankSlug: 'hdfc',
      name: 'HDFC BizBlack Metal',
      beancountName: 'BizBlack',
      network: 'visa',
      pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 5, per: 150 },
        accelerators: [
          {
            category: 'travel-portal',
            label: 'SmartBuy / biz categories',
            multiplier: 10,
            monthlyCapPoints: 7500,
            notes: '10x on SmartBuy & select business spends; caps differ by category',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify caps.',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-marriott',
      bankSlug: 'hdfc',
      name: 'HDFC Marriott Bonvoy',
      beancountName: 'MarriottBonvoy',
      network: 'diners',
      pool: { ticker: 'BONVOY', programme: 'Marriott Bonvoy' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 2, per: 150 },
        accelerators: [
          { category: 'travel', label: 'Marriott hotels', multiplier: 4, notes: '8 pts/₹150 at Marriott properties' },
          {
            category: 'dining',
            label: 'Travel/dining/entertainment',
            multiplier: 2,
            monthlyCapPoints: 6000,
            notes: '4 pts/₹150, capped per cycle',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Bonvoy points pool under the HDFC wallet for now (standalone programme wallets come with transfers).',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-neu-infinity',
      bankSlug: 'hdfc',
      name: 'HDFC Tata Neu Infinity',
      beancountName: 'NeuInfinity',
      network: 'rupay',
      pool: { ticker: 'NEUCOINS', programme: 'Tata NeuCoins' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 1.5, per: 100 },
        accelerators: [
          {
            category: 'shopping-online',
            label: 'Tata Neu app / Tata brands',
            multiplier: 3.33,
            notes: '5% NeuCoins on Tata Neu (incl. extra 5% for NeuPass); UPI spends 1.5% capped',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: '1 NeuCoin = ₹1 within Tata ecosystem. Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'icici-emeralde',
      bankSlug: 'icici',
      name: 'ICICI Emeralde Private Metal',
      beancountName: 'Emeralde',
      network: 'mastercard',
      pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 6, per: 200 },
        accelerators: [],
        exclusions: ['fuel', 'rent'],
        verified: false,
        notes: '6 RP/₹200 (~3% at ₹1/RP on select redemptions). Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'icici-sapphiro',
      bankSlug: 'icici',
      name: 'ICICI Sapphiro',
      beancountName: 'Sapphiro',
      network: 'amex',
      pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 2, per: 100 },
        accelerators: [],
        exclusions: ['fuel', 'rent'],
        verified: false,
        notes: '2 RP/₹100 domestic, 4 RP/₹100 international (international accelerator needs MCC modelling — M3).',
      },
    ],
  },
  {
    card: {
      slug: 'axis-magnus-burgundy',
      bankSlug: 'axis',
      name: 'Axis Magnus Burgundy',
      beancountName: 'MagnusBurgundy',
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
            monthlyCapPoints: 35000,
            notes: 'Burgundy variant: 5x on Travel Edge with a higher monthly cap than plain Magnus',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet', 'insurance'],
        verified: false,
        notes: 'Public-source rates; admin to verify Burgundy cap.',
      },
    ],
  },
  {
    card: {
      slug: 'axis-privilege',
      bankSlug: 'axis',
      name: 'Axis Privilege',
      beancountName: 'Privilege',
      network: 'visa',
      pool: { ticker: 'EDGE_RP', programme: 'Axis EDGE Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 10, per: 200 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Earns EDGE Reward points (not Miles) — separate ticker in the same Axis wallet.',
      },
    ],
  },
  {
    card: {
      slug: 'sc-ultimate',
      bankSlug: 'standard-chartered',
      name: 'Standard Chartered Ultimate',
      beancountName: 'Ultimate',
      network: 'visa',
      pool: { ticker: 'SC_RP', programme: 'SC 360° Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 5, per: 150 },
        accelerators: [],
        exclusions: ['fuel'],
        verified: false,
        notes: '5 RP/₹150, ~3.3% at ₹1/RP. Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'idfc-vistara',
      bankSlug: 'idfc-first',
      name: 'IDFC FIRST Vistara',
      beancountName: 'Vistara',
      network: 'visa',
      pool: { ticker: 'CV_PTS', programme: 'Club Vistara (→ Air India Maharaja)' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 6, per: 200 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes:
          'Value is milestone-heavy (class upgrade vouchers). CV merged into Air India Maharaja Club — admin to confirm current earn & ticker.',
      },
    ],
  },
  {
    card: {
      slug: 'hsbc-travelone',
      bankSlug: 'hsbc',
      name: 'HSBC TravelOne',
      beancountName: 'TravelOne',
      network: 'visa',
      pool: { ticker: 'HSBC_PTS', programme: 'HSBC Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 2, per: 100 },
        accelerators: [
          { category: 'travel', label: 'Flights/hotels/travel aggregators', multiplier: 2, notes: '4 pts/₹100 on travel' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Transferable to airline/hotel partners. Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'hsbc-premier',
      bankSlug: 'hsbc',
      name: 'HSBC Premier',
      beancountName: 'Premier',
      network: 'mastercard',
      pool: { ticker: 'HSBC_PTS', programme: 'HSBC Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 3, per: 100 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'indusind-qatar-avios',
      bankSlug: 'indusind',
      name: 'IndusInd Qatar Airways Avios',
      beancountName: 'QatarAvios',
      network: 'visa',
      pool: { ticker: 'AVIOS', programme: 'Qatar Airways Privilege Club (Avios)' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-06-01',
        base: { points: 3, per: 100 },
        accelerators: [
          { category: 'travel', label: 'Qatar Airways spends', multiplier: 2, notes: 'Accelerated Avios on Qatar direct bookings' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify tier (Signature vs Infinite) numbers.',
      },
    ],
  },
  {
    card: {
      slug: 'au-ixigo',
      bankSlug: 'au',
      name: 'AU ixigo',
      beancountName: 'Ixigo',
      network: 'rupay',
      pool: { ticker: 'AU_RP', programme: 'AU Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-06-01',
        base: { points: 10, per: 200 },
        accelerators: [
          { category: 'travel', label: 'ixigo bookings (trains/flights)', multiplier: 2, notes: 'Accelerated on ixigo platform' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Approximate — AU ixigo rates vary by channel; admin must verify.',
      },
    ],
  },
  {
    card: {
      slug: 'bob-eterna',
      bankSlug: 'bob',
      name: 'BoB Eterna',
      beancountName: 'Eterna',
      network: 'visa',
      pool: { ticker: 'BOB_RP', programme: 'BoB Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 3, per: 100 },
        accelerators: [
          {
            category: 'travel',
            label: 'Travel/dining/international/online (select)',
            multiplier: 5,
            monthlyCapPoints: 5000,
            notes: '15 RP/₹100 on select categories, capped per cycle',
          },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'bob-etihad',
      bankSlug: 'bob',
      name: 'BoB Etihad Guest',
      beancountName: 'EtihadGuest',
      network: 'visa',
      pool: { ticker: 'ETIHAD_MILES', programme: 'Etihad Guest Miles' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 3, per: 200 },
        accelerators: [
          { category: 'travel', label: 'Etihad direct / international', multiplier: 2, notes: 'Accelerated Guest Miles on Etihad & intl spends' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify tier (Premier vs Select) numbers.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Ecosystem sweep — other well-known cards from the same banks. Rates are
  // public-knowledge approximations, ALL verified:false pending admin review.

  {
    card: {
      slug: 'hdfc-diners-black',
      bankSlug: 'hdfc',
      name: 'HDFC Diners Club Black',
      beancountName: 'DinersBlack',
      network: 'diners',
      pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 5, per: 150 },
        accelerators: [
          { category: 'travel-portal', label: 'SmartBuy portal', multiplier: 10, monthlyCapPoints: 15000, notes: '10x SmartBuy (shared monthly cap family with Infinia-tier cards)' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-regalia-gold',
      bankSlug: 'hdfc',
      name: 'HDFC Regalia Gold',
      beancountName: 'RegaliaGold',
      network: 'visa',
      pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 4, per: 150 },
        accelerators: [
          { category: 'shopping-online', label: 'Nykaa/Myntra/M&S/Reliance Digital', multiplier: 5, notes: '20 RP/₹150 at partner brands' },
          { category: 'travel-portal', label: 'SmartBuy portal', multiplier: 10, monthlyCapPoints: 5000, notes: 'SmartBuy accelerated' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-millennia',
      bankSlug: 'hdfc',
      name: 'HDFC Millennia',
      beancountName: 'Millennia',
      network: 'visa',
      pool: { ticker: 'HDFC_CB', programme: 'Millennia CashPoints' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          { category: 'shopping-online', label: 'Amazon/Flipkart/partner apps', multiplier: 5, monthlyCapPoints: 1000, notes: '5% CashPoints at partners, capped/cycle' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: '1 CashPoint ≈ ₹1 (redemption haircuts apply). Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'hdfc-neu-plus',
      bankSlug: 'hdfc',
      name: 'HDFC Tata Neu Plus',
      beancountName: 'NeuPlus',
      network: 'rupay',
      pool: { ticker: 'NEUCOINS', programme: 'Tata NeuCoins' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          { category: 'shopping-online', label: 'Tata Neu app / Tata brands', multiplier: 2, notes: '2% on Tata Neu (+NeuPass extra)' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'icici-coral',
      bankSlug: 'icici',
      name: 'ICICI Coral',
      beancountName: 'Coral',
      network: 'visa',
      pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 2, per: 100 },
        accelerators: [],
        exclusions: ['fuel', 'rent'],
        verified: false,
        notes: 'Entry-level; category caps apply. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'icici-makemytrip',
      bankSlug: 'icici',
      name: 'MakeMyTrip ICICI',
      beancountName: 'MakeMyTrip',
      network: 'mastercard',
      pool: { ticker: 'MYCASH', programme: 'MMT myCash' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-01-01',
        base: { points: 2, per: 200 },
        accelerators: [
          { category: 'travel', label: 'MakeMyTrip bookings', multiplier: 3, notes: 'Accelerated myCash on MMT hotels/flights' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: '1 myCash = ₹1 on MMT. Approximate; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'axis-ace',
      bankSlug: 'axis',
      name: 'Axis Ace',
      beancountName: 'Ace',
      network: 'visa',
      pool: { ticker: 'AXIS_CB', programme: 'Axis cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1.5, per: 100 },
        accelerators: [
          { category: 'utilities', label: 'Bill payments via Google Pay', multiplier: 3.33, monthlyCapPoints: 500, notes: '5% on bills via GPay, capped' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Cashback card (1 pt = ₹1). Admin to verify current caps.',
      },
    ],
  },
  {
    card: {
      slug: 'axis-flipkart',
      bankSlug: 'axis',
      name: 'Flipkart Axis',
      beancountName: 'Flipkart',
      network: 'visa',
      pool: { ticker: 'AXIS_CB', programme: 'Axis cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          { category: 'shopping-online', label: 'Flipkart', multiplier: 5, notes: '5% on Flipkart (4% post-2024 revision — verify)' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Cashback card. Admin to verify current rates.',
      },
    ],
  },
  {
    card: {
      slug: 'axis-airtel',
      bankSlug: 'axis',
      name: 'Airtel Axis',
      beancountName: 'Airtel',
      network: 'visa',
      pool: { ticker: 'AXIS_CB', programme: 'Axis cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          { category: 'utilities', label: 'Airtel app (bills/recharge) & utilities', multiplier: 10, monthlyCapPoints: 500, notes: '25% on Airtel services / 10% utilities via Airtel Thanks, capped' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Cashback card. Admin to verify per-bucket caps.',
      },
    ],
  },
  {
    card: {
      slug: 'sbi-elite',
      bankSlug: 'sbi',
      name: 'SBI Card ELITE',
      beancountName: 'Elite',
      network: 'visa',
      pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 2, per: 100 },
        accelerators: [
          { category: 'dining', label: 'Dining/departmental/grocery', multiplier: 5, monthlyCapPoints: 7500, notes: '10 RP/₹100 on select categories' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'sbi-simplyclick',
      bankSlug: 'sbi',
      name: 'SBI SimplyCLICK',
      beancountName: 'SimplyClick',
      network: 'visa',
      pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          { category: 'shopping-online', label: 'Online partners (Amazon/BookMyShow/…)', multiplier: 10, monthlyCapPoints: 10000, notes: '10x at partners, 5x other online' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'RP value ~₹0.25. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'sbi-prime',
      bankSlug: 'sbi',
      name: 'SBI Card PRIME',
      beancountName: 'Prime',
      network: 'visa',
      pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 2, per: 100 },
        accelerators: [
          { category: 'dining', label: 'Dining/groceries/movies', multiplier: 5, notes: '10 RP/₹100 on select categories' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'amex-platinum',
      bankSlug: 'amex',
      name: 'Amex Platinum (Charge)',
      beancountName: 'Platinum',
      network: 'amex',
      pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 40 },
        accelerators: [],
        exclusions: ['fuel', 'insurance', 'utilities'],
        verified: false,
        notes: 'Charge card; value is benefits-led. Admin to verify earn exclusions.',
      },
    ],
  },
  {
    card: {
      slug: 'amex-smartearn',
      bankSlug: 'amex',
      name: 'Amex SmartEarn',
      beancountName: 'SmartEarn',
      network: 'amex',
      pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 50 },
        accelerators: [
          { category: 'shopping-online', label: 'Amazon/Flipkart/Uber partners', multiplier: 10, monthlyCapPoints: 500, notes: '10x at partners, capped per bucket/month' },
        ],
        exclusions: ['fuel', 'insurance', 'utilities'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'sc-smart',
      bankSlug: 'standard-chartered',
      name: 'Standard Chartered Smart',
      beancountName: 'Smart',
      network: 'visa',
      pool: { ticker: 'SC_CB', programme: 'SC cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [
          { category: 'shopping-online', label: 'Online spends', multiplier: 2, monthlyCapPoints: 1000, notes: '2% online / 1% offline, capped' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Cashback card. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'sc-easemytrip',
      bankSlug: 'standard-chartered',
      name: 'Standard Chartered EaseMyTrip',
      beancountName: 'EaseMyTrip',
      network: 'visa',
      pool: { ticker: 'SC_RP', programme: 'SC 360° Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 2, per: 100 },
        accelerators: [
          { category: 'travel', label: 'EaseMyTrip bookings', multiplier: 5, notes: 'Discount vouchers + accelerated points on EMT' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Approximate; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'hsbc-live-plus',
      bankSlug: 'hsbc',
      name: 'HSBC Live+',
      beancountName: 'LivePlus',
      network: 'visa',
      pool: { ticker: 'HSBC_CB', programme: 'HSBC cashback' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-06-01',
        base: { points: 1.5, per: 100 },
        accelerators: [
          { category: 'dining', label: 'Dining/food delivery/groceries', multiplier: 6.67, monthlyCapPoints: 1000, notes: '10% on dining & groceries, capped ₹1,000/month' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Cashback card. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'indusind-legend',
      bankSlug: 'indusind',
      name: 'IndusInd Legend',
      beancountName: 'Legend',
      network: 'visa',
      pool: { ticker: 'INDUS_RP', programme: 'IndusInd Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: '2 RP/₹100 on weekends (day-of-week earn needs M3 modelling). Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'indusind-eazydiner',
      bankSlug: 'indusind',
      name: 'IndusInd EazyDiner',
      beancountName: 'EazyDiner',
      network: 'visa',
      pool: { ticker: 'INDUS_RP', programme: 'IndusInd Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 2, per: 100 },
        accelerators: [
          { category: 'dining', label: 'EazyDiner / dining', multiplier: 5, monthlyCapPoints: 4000, notes: 'Accelerated on dining + EazyDiner Prime benefits' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Approximate; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'au-zenith',
      bankSlug: 'au',
      name: 'AU Zenith',
      beancountName: 'Zenith',
      network: 'visa',
      pool: { ticker: 'AU_RP', programme: 'AU Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 10, per: 200 },
        accelerators: [
          { category: 'dining', label: 'Dining', multiplier: 2, notes: 'Accelerated on dining' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Approximate; admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'au-lit',
      bankSlug: 'au',
      name: 'AU LIT',
      beancountName: 'LIT',
      network: 'visa',
      pool: { ticker: 'AU_RP', programme: 'AU Reward Points' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 1, per: 100 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Customisable card — features (5x/10x packs) toggle monthly; model chosen packs when M3 lands. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'idfc-wealth',
      bankSlug: 'idfc-first',
      name: 'IDFC FIRST Wealth',
      beancountName: 'Wealth',
      network: 'visa',
      pool: { ticker: 'IDFC_RP', programme: 'IDFC FIRST Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 3, per: 150 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: '10 RP/₹150 on incremental spends above ₹20k/cycle + birthday 10x — spend-slab earn needs M3 modelling. RP ≈ ₹0.25. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'idfc-mayura',
      bankSlug: 'idfc-first',
      name: 'IDFC FIRST Mayura',
      beancountName: 'Mayura',
      network: 'visa',
      pool: { ticker: 'IDFC_RP', programme: 'IDFC FIRST Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2024-09-01',
        base: { points: 5, per: 150 },
        accelerators: [],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Metal flagship (2024); slab/international benefits need verification. Admin to verify.',
      },
    ],
  },
  {
    card: {
      slug: 'bob-premier',
      bankSlug: 'bob',
      name: 'BoB Premier',
      beancountName: 'Premier',
      network: 'visa',
      pool: { ticker: 'BOB_RP', programme: 'BoB Rewards' },
      active: true,
    },
    rules: [
      {
        effectiveFrom: '2023-01-01',
        base: { points: 2, per: 100 },
        accelerators: [
          { category: 'travel', label: 'Travel/dining/international', multiplier: 5, notes: '10 RP/₹100 on select categories' },
        ],
        exclusions: ['fuel', 'rent', 'wallet'],
        verified: false,
        notes: 'Public-source rates; admin to verify.',
      },
    ],
  },
]
