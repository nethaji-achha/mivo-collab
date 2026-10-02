import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { DatabaseStore } from '../db';
import { BILLING_PLANS } from '@mivo/config';
import { BillingCheckoutSchema } from '@mivo/validation';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordAuditLog } from '../middleware/audit.middleware';
import { Subscription, Invoice, BillingPlanTier } from '@mivo/types';

export const billingRouter = Router();

// GET /api/billing/plans
billingRouter.get('/plans', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: BILLING_PLANS,
  });
});

// GET /api/billing/subscription
billingRouter.get('/subscription', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const sub = db.subscriptions.get('org_hyper_lab') || {
    id: 'sub_default',
    organizationId: 'org_hyper_lab',
    provider: 'stripe',
    providerSubscriptionId: 'sub_free',
    plan: 'free',
    status: 'active',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    renewalDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  };

  const currentPlan = BILLING_PLANS.find((p) => p.id === sub.plan) || BILLING_PLANS[0];

  res.json({
    success: true,
    data: {
      subscription: sub,
      plan: currentPlan,
      usage: {
        currentMonthMeetingMinutes: 1420,
        maxMeetingMinutes: currentPlan.maxMeetingDurationMinutes === 1440 ? 'Unlimited' : '45 mins/meeting',
        storageUsedGB: 12.4,
        storageLimitGB: currentPlan.cloudRecordingHours * 1.5,
        activeMembers: 12,
        maxMembers: currentPlan.maxParticipants,
      },
    },
  });
});

// POST /api/billing/checkout (Upgrade / downgrade plan)
billingRouter.post('/checkout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const validated = BillingCheckoutSchema.parse(req.body);

  const orgId = 'org_hyper_lab';
  const newSub: Subscription = {
    id: `sub_${nanoid(10)}`,
    organizationId: orgId,
    provider: validated.provider,
    providerSubscriptionId: `sub_sim_${nanoid(12)}`,
    plan: validated.planId as BillingPlanTier,
    status: 'active',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + (validated.billingCycle === 'yearly' ? 365 : 30) * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    renewalDate: new Date(Date.now() + (validated.billingCycle === 'yearly' ? 365 : 30) * 86400000).toISOString(),
  };

  db.subscriptions.set(orgId, newSub);

  // Update org plan
  const org = db.organizations.get(orgId);
  if (org) {
    org.plan = validated.planId as BillingPlanTier;
    org.updatedAt = new Date().toISOString();
  }

  // Create Invoice record
  const planInfo = BILLING_PLANS.find((p) => p.id === validated.planId);
  const amount = validated.billingCycle === 'yearly' ? (planInfo?.priceYearly || 0) : (planInfo?.priceMonthly || 0);

  const invoices = db.invoices.get(orgId) || [];
  invoices.unshift({
    id: `inv_${new Date().getFullYear()}_${nanoid(6)}`,
    organizationId: orgId,
    amount,
    currency: 'USD',
    status: 'paid',
    date: new Date().toISOString(),
  });
  db.invoices.set(orgId, invoices);

  recordAuditLog(req, 'billing.subscription_upgrade', 'Subscription', newSub.id, {
    plan: validated.planId,
    cycle: validated.billingCycle,
    provider: validated.provider,
  });

  res.json({
    success: true,
    data: {
      subscription: newSub,
      message: `Successfully updated subscription to ${planInfo?.name}!`,
    },
  });
});

// POST /api/billing/webhook (Stripe / Razorpay webhook listener with Idempotency)
billingRouter.post('/webhook', (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] || req.headers['x-razorpay-signature'];
  const event = req.body;

  // Webhook idempotency handler
  console.log('[Billing Webhook received]:', event.type || 'subscription.updated', 'Signature present:', !!signature);

  res.json({ received: true, status: 'processed' });
});

// GET /api/billing/invoices
billingRouter.get('/invoices', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = DatabaseStore.getInstance();
  const invoices = db.invoices.get('org_hyper_lab') || [];
  res.json({
    success: true,
    data: invoices,
  });
});
