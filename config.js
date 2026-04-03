/* config.js — Suryadoot Energy Solution */
/* Update these values when government policy changes. No other file needs editing. */
const SOLAR_CONFIG = {

  /* === GENERATION ASSUMPTIONS === */
  peakSunHours: 4.5,        // MP average peak sun hours per day
  systemEfficiency: 0.80,   // Accounting for inverter losses, soiling, temperature
  // Daily generation per kW = peakSunHours × systemEfficiency

  /* === DEFAULT TARIFF RATES (₹/kWh) === */
  tariff: {
    residential: 7.0,   // MPPKVVCL / MPMKVVCL residential slab (update periodically)
    commercial:  9.5,   // Commercial LT rate
    industrial: 10.5,   // Industrial rate
  },

  /* === SYSTEM COST (₹ per kW, all-inclusive) === */
  costPerKw: {
    residential: 55000,   // Panels + Inverter + Mounting + Labour + Net-meter
    commercial:  48000,   // Slightly lower at scale
  },

  /* === ROOF AREA RULE === */
  sqftPerKw: 100,   // Approx 100 sq.ft of shadow-free roof per 1 kW

  /* === BILL-TO-SYSTEM SIZING RULE === */
  billPerKw: 1200,  // ₹1,200 monthly bill ≈ 1 kW of solar needed

  /* === PM SURYA GHAR MUFT BIJLI YOJANA SUBSIDY === */
  /* Applicable only for Residential / On-Grid systems */
  /* Update slabs when MNRE revises the scheme */
  subsidy: {
    upTo1kW:  30000,   // ₹30,000 subsidy for systems up to 1 kW
    upTo2kW:  60000,   // ₹60,000 subsidy for systems 1–2 kW
    upTo3kW:  78000,   // ₹78,000 subsidy for systems 2–3 kW
    above3kW: 78000,   // ₹78,000 cap for systems above 3 kW
  },

  /* === ENVIRONMENT CONSTANTS === */
  co2PerUnit: 0.82,     // kg CO₂ saved per kWh (CEA India emission factor 2023)
  treesPerKw: 25,       // Equivalent tree absorption per kW per year (approx)

  /* === CONTACT & WA DETAILS === */
  whatsappNumber: '918989933932',
  waBaseUrl: 'https://wa.me/',
};
