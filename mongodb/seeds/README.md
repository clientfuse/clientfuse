# Subscription Plans Seed Data

This directory contains seed data for subscription plans based on Stripe products and prices.

## Files

- **`subscription-plans.json`** - JSON seed data for MongoDB import

## Plans Overview

| Tier   | Period  | Price    | Stripe Price ID                    | Stripe Product ID        |
|--------|---------|----------|------------------------------------|--------------------------|
| Bronze | Monthly | $49.00   | `price_1SICFm6VRdKptkbdwuY8ZePx`  | `prod_TEfaiFJxOVPVas`   |
| Bronze | Annual  | $490.00  | `price_1SICG16VRdKptkbdI9IgjE69`  | `prod_TEfaiFJxOVPVas`   |
| Silver | Monthly | $99.00   | `price_1SICIH6VRdKptkbdOHR3JyiO`  | `prod_TEfdDPdUbrEcV0`   |
| Silver | Annual  | $990.00  | `price_1SICIH6VRdKptkbdmdEoEg0g`  | `prod_TEfdDPdUbrEcV0`   |
| Gold   | Monthly | $249.00  | `price_1SICJQ6VRdKptkbdYsRuijFR`  | `prod_TEfeUHRC0pgLqy`   |
| Gold   | Annual  | $2490.00 | `price_1SICJQ6VRdKptkbd9m5mX8Mz`  | `prod_TEfeUHRC0pgLqy`   |

## Plan Limits

| Tier   | White Labeling | Team Members | Custom Links | Multiplier vs Bronze |
|--------|----------------|--------------|--------------|----------------------|
| Bronze | ❌ No          | 2            | 5            | 1x (baseline)        |
| Silver | ❌ No          | 5            | 15           | 2.5x / 3x            |
| Gold   | ✅ **Yes**     | 20           | 50           | 10x                  |

## Usage

### Using MongoDB Compass (Recommended)

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `subscriptionplans` collection (create if doesn't exist)
4. Click "Add Data" → "Import JSON or CSV file"
5. Select `subscription-plans.json`
6. Click "Import"

### Using mongoimport CLI

```bash
mongoimport --uri="mongodb://localhost:27017/clientfuse" \
  --collection=subscriptionplans \
  --file=mongodb/seeds/subscription-plans.json \
  --jsonArray \
  --drop
```

The `--drop` flag will clear existing data before importing.

### Using mongosh

```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/clientfuse"

# Switch to your database
use clientfuse

# Clear existing data
db.subscriptionplans.deleteMany({})

# Load and insert the data
load('mongodb/seeds/subscription-plans.json')
```

## Verification

After seeding, verify the data:

```javascript
// In mongosh
use clientfuse

// Count plans (should return 6)
db.subscriptionplans.countDocuments()

// List all plans
db.subscriptionplans.find().pretty()

// Find by tier
db.subscriptionplans.find({ tierType: 'bronze' })
db.subscriptionplans.find({ tierType: 'silver' })
db.subscriptionplans.find({ tierType: 'gold' })

// Find by billing period
db.subscriptionplans.find({ billingPeriod: 'monthly' })
db.subscriptionplans.find({ billingPeriod: 'annual' })

// Check white labeling
db.subscriptionplans.find({ 'limits.whiteLabeling': true })
```

## Notes

- Prices are stored in **cents** (e.g., 4900 = $49.00)
- All plans have 7-day trial period configured in the backend
- White-labeling is **only available** in the Gold tier
- Custom connection links exclude default links
- Created on: 2025-10-15

## Updating Plans

To update existing plans:

1. Modify `subscription-plans.json`
2. Re-import using mongoimport with `--drop` flag or clear collection first

**Warning:** Re-importing will replace all existing plans!

## Indexes

The following indexes are automatically created by Mongoose:

- Unique: `{ tierType: 1, billingPeriod: 1 }`
- Unique: `{ stripePriceId: 1 }`
- Non-unique: `{ stripeProductId: 1 }`
- Non-unique: `{ isActive: 1 }`
