// STAGING FILE — NOT wired into the seed and intentionally left uncommitted.
// Network-tier benefits (Visa/Mastercard/RuPay/Diners/Amex) and card/merchant
// offers, to be folded into the KB later once the shape settles. Self-contained
// types so it can evolve independently of src/lib/kb/schema.ts.
// Researched July 2026 (network programme pages + NPCI circular + issuer
// microsites; verify against network/bank T&C before promoting).
//
// KEY MODELLING NOTE (from research): quantities vary in WHO sets them —
//  - Visa Infinite/Signature: network guarantees only concierge + global
//    assistance + an insurance FRAMEWORK; lounge/golf/movie counts are all
//    ISSUER-configured (marked quantity 'issuer-dependent').
//  - Mastercard World Elite/World: golf rounds/lessons + culinary + hotel-status
//    are network-MANDATED (hard quantities); lounge count is issuer-set.
//  - RuPay Select: NPCI mandates exact quantities (circular 25-Feb-2025, eff
//    1-Apr-2025) — the most standardised tier.
//  - Diners Black (India): HDFC is the sole issuer, so network≈issuer; the
//    network layer contributes unlimited Diners lounge access.

export type Benefit = {
  category:
    | 'lounge-domestic'
    | 'lounge-international'
    | 'movie'
    | 'golf'
    | 'dining'
    | 'concierge'
    | 'meet-and-greet'
    | 'loyalty-status'
    | 'insurance'
    | 'wellness'
    | 'other'
  title: string
  detail?: string
  quantity?: string // "2/quarter", "unlimited", "12/year", "issuer-dependent"
  cardCondition?: string // spend/tier gating, if any
  verified?: boolean // true only where a network/NPCI/official source confirmed
  source?: string
}

export type NetworkTier =
  | 'visa-infinite'
  | 'visa-signature'
  | 'mastercard-world-elite'
  | 'mastercard-world'
  | 'rupay-select'
  | 'diners-black'
  | 'amex'

export const NETWORK_BENEFITS: Record<NetworkTier, Benefit[]> = {
  'visa-infinite': [
    { category: 'concierge', title: 'Visa Infinite Concierge', detail: '24/7 lifestyle concierge — bookings, reservations, tickets', quantity: 'unlimited', verified: true, source: 'visa.co.in/pay-with-visa/find-a-card/visa-infinite.html' },
    { category: 'lounge-domestic', title: 'Domestic lounge access', detail: 'Count set by issuer (Visa mandates none)', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com/blog/hidden-benefits-of-visa-infinite/' },
    { category: 'lounge-international', title: 'International lounge (Priority Pass Select)', detail: 'PP Select typically included; visit count issuer-set (often 2/qtr free then $35)', quantity: 'issuer-dependent', verified: false, source: 'sc.com/in/stories/visa-infinite-the-priority-you-deserve/' },
    { category: 'golf', title: 'Troon Privé golf access', detail: '~$99/round at 20+ Troon Privé clubs + up to 3 guests; free green fees are an issuer add-on', quantity: 'issuer-dependent', verified: false, source: 'thepointsguy.com/credit-cards/visa-infinite-program-benefits/' },
    { category: 'insurance', title: 'Travel insurance framework', detail: 'Coverage amounts issuer-configured (air-accident ₹2–5 cr on high-end VI)', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com/blog/hidden-benefits-of-visa-infinite/' },
    { category: 'other', title: 'Visa Global Customer Assistance', detail: '24/7 emergency card block/replace/cash worldwide', quantity: 'unlimited', verified: true, source: 'visa.co.in/pay-with-visa/find-a-card/visa-infinite.html' },
    { category: 'meet-and-greet', title: 'Airport meet-and-greet', detail: 'Select VI cards only (issuer add-on)', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com/blog/hidden-benefits-of-visa-infinite/' },
  ],
  'visa-signature': [
    { category: 'concierge', title: 'Visa Signature Concierge', detail: '24/7 concierge', quantity: 'unlimited', verified: true, source: 'visa.co.in' },
    { category: 'lounge-domestic', title: 'Domestic lounge access', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com/indusind-bank/indusind-bank-signature-visa-credit-card/' },
    { category: 'lounge-international', title: 'International lounge (Priority Pass)', detail: 'Issuer-provided on premium VS cards', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com' },
    { category: 'golf', title: 'Golf programme', detail: 'Issuer-provided (e.g. IndusInd VS: 1 round + 1 lesson/mo)', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com' },
    { category: 'movie', title: 'BookMyShow BOGO', detail: 'Issuer-provided (e.g. IndusInd VS up to 3 free/mo, ≤₹200/ticket)', quantity: 'issuer-dependent', verified: false, source: 'cardinsider.com' },
    { category: 'insurance', title: 'Travel insurance', quantity: 'issuer-dependent', verified: false, source: 'stablemoney.in' },
    { category: 'other', title: 'Visa Global Customer Assistance', quantity: 'unlimited', verified: true, source: 'visa.co.in' },
  ],
  'mastercard-world-elite': [
    { category: 'golf', title: 'MC World Elite golf — free rounds', detail: '12 green-fee rounds/yr (max 3/qtr) at 17 courses; IGU handicap + 7-day booking', quantity: '12/year (3/qtr)', verified: true, source: 'indusind.bank.in/in/en/microsites/crest/golf/mastercard-golf-program.html' },
    { category: 'golf', title: 'MC World Elite golf — guest rounds', detail: '4 guest green fees/yr (max 1/qtr)', quantity: '4/year (1/qtr)', verified: true, source: 'indusind.bank.in' },
    { category: 'golf', title: 'MC World Elite golf — lessons', detail: '12 lessons/yr (max 3/qtr) at 14 facilities; valid to 30-Apr-2027', quantity: '12/year (3/qtr)', verified: true, source: 'utkarsh.bank.in/offers/2775' },
    { category: 'dining', title: 'Mastercard Culinary Club', detail: 'Up to 30% + BOGO at 350+ restaurants across 18 cities', quantity: 'unlimited', verified: true, source: 'cardinsider.com/blog/mastercard-launches-culinary-club-program-india/' },
    { category: 'dining', title: 'Club ITC Culinaire', detail: '20–25% dining savings + 25% bonus F&B points at ITC Hotels', quantity: 'unlimited', verified: false, source: 'cardmaven.in/forum (World Elite)' },
    { category: 'dining', title: 'Taj Epicure', detail: '25% off F&B/spa at 80+ Taj hotels', quantity: 'unlimited', verified: false, source: 'cardmaven.in/forum' },
    { category: 'loyalty-status', title: 'GHA Discovery Titanium (fast-track)', detail: '7% DISCOVERY$, upgrades, breakfast; valid to 31-Dec-2026', quantity: 'annual', verified: true, source: 'cardinsider.com/blog/complimentary-gha-discovery-elite-status-mastercard-credit-card/' },
    { category: 'loyalty-status', title: 'Wyndham Diamond (fast-track)', detail: 'No-nights status; valid to 31-Dec-2026', quantity: 'annual', verified: true, source: 'cardinsider.com/blog/loyalty-status-match-mastercard/' },
    { category: 'lounge-domestic', title: 'Airport lounge (LoungeKey)', detail: '43–53 domestic lounges; visit count issuer-set', quantity: 'issuer-dependent', verified: false, source: 'cardmaven.in/forum' },
    { category: 'concierge', title: 'World Elite 24/7 concierge', quantity: 'unlimited', verified: true, source: 'indusind.bank.in' },
    { category: 'wellness', title: 'Second medical opinion', detail: '50,000+ global specialists, cardholder + family', quantity: 'unlimited', verified: false, source: 'cardmaven.in/forum' },
    { category: 'other', title: '3GB global data roaming', detail: '15 days/trip', quantity: 'per trip', verified: false, source: 'cardmaven.in/forum' },
    { category: 'other', title: '24/7 roadside assistance', quantity: 'unlimited', verified: false, source: 'cardmaven.in/forum' },
  ],
  'mastercard-world': [
    { category: 'golf', title: 'MC World golf — free rounds', detail: '4 rounds/yr (max 1/qtr)', quantity: '4/year (1/qtr)', verified: true, source: 'specials.priceless.com (MC World India Golf)' },
    { category: 'dining', title: 'Mastercard Culinary Club', detail: 'Shared with World Elite — 30% + BOGO at 350+ restaurants', quantity: 'unlimited', verified: true, source: 'cardinsider.com/blog/mastercard-launches-culinary-club-program-india/' },
    { category: 'loyalty-status', title: 'GHA Discovery Platinum (fast-track)', detail: '6% DISCOVERY$, upgrade, welcome gift; valid to 31-Dec-2026', quantity: 'annual', verified: true, source: 'cardinsider.com/blog/complimentary-gha-discovery-elite-status-mastercard-credit-card/' },
    { category: 'loyalty-status', title: 'Wyndham Platinum (fast-track)', detail: 'Valid to 31-Dec-2026', quantity: 'annual', verified: true, source: 'cardinsider.com/blog/loyalty-status-match-mastercard/' },
    { category: 'lounge-domestic', title: 'Airport lounge access', detail: 'Count issuer-set; fewer network mandates than World Elite', quantity: 'issuer-dependent', verified: false, source: 'technofino.in/community' },
    { category: 'concierge', title: 'Mastercard World concierge', quantity: 'unlimited', verified: false, source: 'technofino.in/community' },
  ],
  'rupay-select': [
    // All NPCI-mandated (circular 25-Feb-2025, eff 1-Apr-2025).
    { category: 'lounge-domestic', title: 'Domestic lounge access', quantity: '1/quarter (4/yr)', verified: true, source: 'businesstoday.in (NPCI RuPay Select)' },
    { category: 'lounge-international', title: 'International lounge access', quantity: '2/year', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'golf', title: 'Golf lesson or round', quantity: '1/quarter (4/yr)', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'wellness', title: 'Gym membership', detail: '90 days home / 30 days offline', quantity: '1/quarter', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'wellness', title: 'Health check-up package', quantity: '1/quarter', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'wellness', title: 'Spa / salon service', quantity: '1/quarter', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'other', title: 'Cab coupon', detail: '₹100', quantity: '1/quarter', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'other', title: 'OTT subscription', detail: 'Prime / Hotstar / SonyLIV (pick one)', quantity: '1/year', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'insurance', title: 'Personal accident insurance', detail: '₹10L; needs a RuPay txn in prior 30 days', quantity: '₹10 lakh', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'concierge', title: '24/7 multilingual concierge', quantity: 'unlimited', verified: true, source: 'businesstoday.in (NPCI)' },
    { category: 'movie', title: 'BookMyShow offer', detail: 'Some issuers (e.g. BoI) 2 free/mo ≤₹500; NOT in NPCI circular', quantity: 'issuer-dependent', verified: false, source: 'bankofindia.bank.in' },
  ],
  'diners-black': [
    // India = HDFC-only issuer; network layer = unlimited Diners lounge access.
    { category: 'lounge-domestic', title: 'Unlimited domestic lounge', detail: 'Primary + add-on', quantity: 'unlimited', verified: true, source: 'cardinsider.com/hdfc-bank/hdfc-bank-diners-club-black-credit-card/' },
    { category: 'lounge-international', title: 'Unlimited international lounge', detail: '1,000+ Diners network lounges; primary + add-on', quantity: 'unlimited', verified: true, source: 'cardinsider.com' },
    { category: 'golf', title: 'Complimentary golf', detail: '6 games/qtr at premium courses via golf concierge', quantity: '6/quarter (24/yr)', verified: true, source: 'cardinsider.com' },
    { category: 'concierge', title: '24/7 concierge', quantity: 'unlimited', verified: true, source: 'cardinsider.com' },
    { category: 'insurance', title: 'Air accident cover', quantity: '₹2 crore', verified: true, source: 'cardinsider.com' },
    { category: 'insurance', title: 'Overseas hospitalization', quantity: '₹50 lakh', verified: true, source: 'cardinsider.com' },
    { category: 'insurance', title: 'Credit liability cover', quantity: '₹9 lakh', verified: true, source: 'cardinsider.com' },
    { category: 'dining', title: 'Club Marriott membership', quantity: 'annual', cardCondition: '₹8L+ annual spend', verified: true, source: 'cardinsider.com' },
    { category: 'other', title: 'Swiggy One membership', quantity: 'annual', cardCondition: '₹8L+ annual spend', verified: true, source: 'cardinsider.com' },
  ],
  // Amex is its own network + issuer — benefits are captured on the Amex cards
  // themselves (milestones/offers) rather than a shared network tier.
  amex: [],
}

// Card-specific offers/benefits (welcome offers, ongoing merchant tie-ups,
// complimentary memberships) keyed by card slug. Most spend-triggered rewards
// already live as milestones in the KB; populate this with non-spend perks /
// standing merchant offers as they're researched.
export const CARD_OFFERS: Record<string, Benefit[]> = {}
