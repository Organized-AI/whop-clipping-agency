# Phase 1: Whop Product Setup

## Objective
Create Whop products and plans for the three clipping agency tiers (Starter, Growth, Scale).

---

## Prerequisites
- Phase 0 complete
- Whop API key configured in `.env`
- Whop App ID configured in `.env`

---

## Agent Usage
Claude Code will automatically invoke:
- **whop-specialist**: Product/plan creation, SDK patterns
- **backend-dev**: Type definitions, service structure

---

## Tasks

### 1. Create Product Configuration

Create `src/config/products.ts`:

```typescript
export interface TierConfig {
  name: string;
  slug: string;
  price: number; // cents
  clipsPerMonth: number;
  minAdBudget: number;
  maxAdBudget: number | null;
  description: string;
}

export const TIERS: Record<string, TierConfig> = {
  starter: {
    name: "Starter Package",
    slug: "starter",
    price: 500000, // $5,000
    clipsPerMonth: 30,
    minAdBudget: 2000,
    maxAdBudget: 5000,
    description: "30 clips/month for growing brands with $2k-$5k ad budget",
  },
  growth: {
    name: "Growth Package",
    slug: "growth",
    price: 800000, // $8,000
    clipsPerMonth: 60,
    minAdBudget: 5000,
    maxAdBudget: 15000,
    description: "60 clips/month for scaling brands with $5k-$15k ad budget",
  },
  scale: {
    name: "Scale Package",
    slug: "scale",
    price: 1500000, // $15,000
    clipsPerMonth: 120,
    minAdBudget: 15000,
    maxAdBudget: null,
    description: "120 clips/month for enterprise brands with $15k+ ad budget",
  },
};

export const CHECKOUT_FIELDS = [
  {
    key: "company_name",
    label: "Company Name",
    type: "text" as const,
    required: true,
  },
  {
    key: "website_url",
    label: "Website URL",
    type: "url" as const,
    required: true,
  },
  {
    key: "monthly_ad_budget",
    label: "Monthly Ad Budget ($)",
    type: "number" as const,
    required: true,
  },
  {
    key: "primary_platforms",
    label: "Primary Social Platforms",
    type: "text" as const,
    required: true,
    placeholder: "TikTok, Instagram, YouTube",
  },
];
```

### 2. Create Whop Type Definitions

Create `src/types/whop.ts`:

```typescript
export interface WhopProduct {
  id: string;
  name: string;
  visibility: "visible" | "hidden" | "archived";
  created_at: number;
  experiences: WhopExperience[];
}

export interface WhopPlan {
  id: string;
  product_id: string;
  plan_type: "one_time" | "renewal";
  renewal_period: "monthly" | "yearly" | "weekly" | "daily";
  initial_price: number;
  renewal_price: number;
  currency: string;
}

export interface WhopExperience {
  id: string;
  name: string;
  type: string;
}

export interface WhopMembership {
  id: string;
  product_id: string;
  plan_id: string;
  user_id: string;
  status: MembershipStatus;
  valid: boolean;
  created_at: number;
  metadata?: Record<string, unknown>;
}

export type MembershipStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "completed"
  | "canceled"
  | "expired";

export interface WhopUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
}

export interface WhopCheckoutField {
  key: string;
  label: string;
  type: "text" | "url" | "number" | "email" | "textarea";
  required: boolean;
  placeholder?: string;
}
```

### 3. Create Whop Client Utility

Create `src/lib/whop-client.ts`:

```typescript
import { WhopAPI } from "@whop/sdk";

let whopClient: WhopAPI | null = null;

export function getWhopClient(): WhopAPI {
  if (!whopClient) {
    if (!process.env.WHOP_API_KEY) {
      throw new Error("WHOP_API_KEY environment variable is required");
    }

    whopClient = new WhopAPI({
      apiKey: process.env.WHOP_API_KEY,
    });
  }

  return whopClient;
}
```

### 4. Create Whop Setup Service

Create `src/services/whop-setup.ts`:

```typescript
import { getWhopClient } from "../lib/whop-client.js";
import { TIERS, TierConfig } from "../config/products.js";

export async function createProduct(tier: TierConfig) {
  const whop = getWhopClient();
  console.log(`Creating product: ${tier.name}`);

  const product = await whop.products.create({
    name: tier.name,
    visibility: "visible",
  });

  console.log(`Created product: ${product.id}`);
  return product;
}

export async function createPlan(productId: string, tier: TierConfig) {
  const whop = getWhopClient();
  console.log(`Creating plan for product: ${productId}`);

  const plan = await whop.plans.create({
    product_id: productId,
    plan_type: "renewal",
    renewal_period: "monthly",
    initial_price: tier.price,
    renewal_price: tier.price,
    currency: "usd",
  });

  console.log(`Created plan: ${plan.id}`);
  return plan;
}

export async function listProducts() {
  const whop = getWhopClient();
  const products = await whop.products.list({
    per: 50,
    page: 1,
  });

  return products;
}

export async function setupAllProducts() {
  console.log("Setting up Whop products...\n");

  const results: Array<{ tier: string; productId: string; planId: string }> = [];

  for (const [key, tier] of Object.entries(TIERS)) {
    try {
      const product = await createProduct(tier);
      const plan = await createPlan(product.id, tier);

      results.push({
        tier: key,
        productId: product.id,
        planId: plan.id,
      });

      console.log(`✅ ${tier.name} setup complete\n`);
    } catch (error) {
      console.error(`❌ Failed to setup ${tier.name}:`, error);
      throw error;
    }
  }

  console.log("\n=== Setup Complete ===");
  console.log("Products created:");
  results.forEach(r => {
    console.log(`  ${r.tier}: ${r.productId} (plan: ${r.planId})`);
  });

  return results;
}

export async function getProductByTier(tierSlug: string) {
  const products = await listProducts();
  const tier = TIERS[tierSlug];

  if (!tier) {
    throw new Error(`Unknown tier: ${tierSlug}`);
  }

  return products.data.find(p => p.name === tier.name);
}
```

### 5. Create Setup Script

Create `src/scripts/setup-products.ts`:

```typescript
import dotenv from "dotenv";
dotenv.config();

import { setupAllProducts } from "../services/whop-setup.js";

async function main() {
  console.log("=== Whop Clipping Agency Setup ===\n");

  if (!process.env.WHOP_API_KEY) {
    console.error("Error: WHOP_API_KEY not set in .env");
    process.exit(1);
  }

  try {
    await setupAllProducts();
    console.log("\nSetup completed successfully!");
  } catch (error) {
    console.error("\nSetup failed:", error);
    process.exit(1);
  }
}

main();
```

---

## Success Criteria

- [ ] `src/config/products.ts` defines all three tiers
- [ ] `src/types/whop.ts` has complete type definitions
- [ ] `src/lib/whop-client.ts` provides singleton client
- [ ] `src/services/whop-setup.ts` can create products and plans
- [ ] `npm run setup` successfully creates products in Whop
- [ ] Products visible in Whop dashboard

---

## Verification Commands

```bash
# Verify TypeScript compiles
npm run typecheck

# Run setup script (requires valid WHOP_API_KEY)
npm run setup
```

---

## Completion

Create `docs/phases/PHASE_1_COMPLETE.md`:

```markdown
# Phase 1: Whop Product Setup - COMPLETE

**Completed:** [DATE]

## Deliverables
- [x] src/config/products.ts - Tier configurations
- [x] src/types/whop.ts - Type definitions
- [x] src/lib/whop-client.ts - Client singleton
- [x] src/services/whop-setup.ts - Setup service
- [x] src/scripts/setup-products.ts - Setup script

## Products Created
- Starter Package: prod_xxx (plan_xxx)
- Growth Package: prod_xxx (plan_xxx)
- Scale Package: prod_xxx (plan_xxx)

## Verification
- `npm run typecheck`: ✅
- `npm run setup`: ✅
- Products visible in Whop: ✅

## Next Phase
Proceed to Phase 2: Webhook Handler
```

Then commit:
```bash
git add -A && git commit -m "Phase 1: Whop product setup complete"
```

Or use: `/commit feat Phase 1 Whop product setup complete`
