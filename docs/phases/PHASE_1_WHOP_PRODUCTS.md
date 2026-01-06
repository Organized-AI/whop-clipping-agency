# Phase 1: Whop Product Setup

## Claude Code Command
```bash
claude --dangerously-skip-permissions
```

## Instructions

Create Whop company, products, and plans for the clipping agency.

### 1. Create src/config/products.ts
Define product configuration:
```typescript
export const PRODUCTS = {
  starter: {
    name: "Starter Package",
    description: "Perfect for creators just starting with paid ads",
    price: 500000, // $5,000 in cents
    clips_per_month: 30,
    ad_budget_min: 2000,
    ad_budget_max: 5000,
  },
  growth: {
    name: "Growth Package", 
    description: "Scale your content with more clips and support",
    price: 800000, // $8,000 in cents
    clips_per_month: 60,
    ad_budget_min: 5000,
    ad_budget_max: 15000,
  },
  scale: {
    name: "Scale Package",
    description: "Full-service content production for serious advertisers",
    price: 1500000, // $15,000 in cents
    clips_per_month: 120,
    ad_budget_min: 15000,
    ad_budget_max: null, // unlimited
  },
} as const;
```

### 2. Create src/types/whop.ts
Type definitions for Whop entities:
- Company
- Product
- Plan
- Membership
- Member

### 3. Create src/services/whop-setup.ts
Functions to configure Whop:

```typescript
// Initialize Whop client
import { WhopAPI } from "@whop/sdk";

const whop = new WhopAPI({
  apiKey: process.env.WHOP_API_KEY,
});

// Create or update products
export async function setupProducts() {
  // List existing products
  // Create/update each tier
  // Return product IDs
}

// Create plans for each product
export async function setupPlans(productIds: Record<string, string>) {
  // Monthly renewal plans
  // Set visibility and access rules
}

// Configure checkout
export async function setupCheckout() {
  // Custom fields for client onboarding:
  // - Company name (required)
  // - Website URL (required)
  // - Monthly ad budget (required)
  // - Primary platforms (multi-select)
  // - Content niche (optional)
}
```

### 4. Create Setup Script
`src/scripts/setup-whop.ts`:
- Run all setup functions
- Log created resource IDs
- Save to config file for reference

## API Endpoints to Use
- GET /products - list existing
- POST /products - create new (if SDK supports)
- GET /plans - list plans
- GET /checkout-configurations - verify setup

## Expected Output
- Three products created in Whop
- Monthly plans for each tier
- Checkout configured with custom fields
- Product IDs saved for webhook handling
