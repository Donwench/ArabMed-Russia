import { supabase } from './supabase';

// Payment Configuration
export const PAYMENT_CONFIG = {
  // YooKassa (Russian payments - MIR, Visa, MC, SBP)
  yookassa: {
    shopId: process.env.EXPO_PUBLIC_YOOKASSA_SHOP_ID || '',
    // Secret key should NEVER be in client code - use Edge Function
    checkoutUrl: 'https://yookassa.ru/checkout',
  },
  // PayPal (international doctors)
  paypal: {
    email: process.env.EXPO_PUBLIC_PAYPAL_EMAIL || '',
  },
  // USDT (crypto option)
  usdt: {
    walletAddress: process.env.EXPO_PUBLIC_USDT_WALLET || '',
    network: 'TRC-20', // Tron network - cheapest fees
  },
};

export type PaymentMethod = 'yookassa' | 'paypal' | 'usdt';

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_type: 'doctor_registration' | 'doctor_monthly' | 'user_subscription';
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  external_id?: string;
  created_at: string;
}

// Doctor Fee Constants (in RUB)
export const DOCTOR_FEES = {
  registration: 1000,
  monthly: 500,
  currency: 'RUB',
  trialDays: 7,
};

// User Subscription Tiers
export const USER_TIERS = {
  free: { price: 0, currency: 'RUB' },
  premium: { price: 399, currency: 'RUB' }, // ~$3.99
  doctor_pro: { price: 999, currency: 'RUB' }, // ~$9.99
};

/**
 * Create a YooKassa payment link for doctor registration
 * In production, this would call a Supabase Edge Function that uses the YooKassa API
 * For now, returns a mock checkout URL
 */
export async function createDoctorPayment(
  userId: string,
  paymentType: 'doctor_registration' | 'doctor_monthly' | 'user_subscription',
  subscriptionAmount?: number
): Promise<{ checkoutUrl: string; paymentId: string } | null> {
  const amount = paymentType === 'doctor_registration'
    ? DOCTOR_FEES.registration
    : paymentType === 'doctor_monthly'
    ? DOCTOR_FEES.monthly
    : subscriptionAmount || USER_TIERS.premium.price;

  // Record the payment intent
  const { data, error } = await supabase.from('payments').insert({
    user_id: userId,
    amount,
    currency: DOCTOR_FEES.currency,
    payment_method: 'yookassa',
    payment_type: paymentType,
    status: 'pending',
  }).select().single();

  if (error || !data) return null;

  // In production: call Supabase Edge Function → YooKassa API → return real checkout URL
  // For now: return payment record ID for manual confirmation
  return {
    checkoutUrl: `https://yookassa.ru/checkout/${data.id}`,
    paymentId: data.id,
  };
}

/**
 * Create payment via PayPal
 * Returns PayPal.me link with amount
 */
export function getPayPalLink(amount: number, currency: string = 'RUB'): string {
  const email = PAYMENT_CONFIG.paypal.email;
  if (!email) return '';
  return `https://paypal.me/${email}/${amount}${currency}`;
}

/**
 * Get USDT payment info
 */
export function getUSDTPaymentInfo(): { address: string; network: string } {
  return {
    address: PAYMENT_CONFIG.usdt.walletAddress,
    network: PAYMENT_CONFIG.usdt.network,
  };
}

/**
 * Check if doctor has active subscription
 */
export async function checkDoctorSubscription(userId: string): Promise<{
  isActive: boolean;
  registrationPaid: boolean;
  trialActive: boolean;
  expiresAt: string | null;
}> {
  const { data, error } = await supabase
    .from('doctor_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return { isActive: false, registrationPaid: false, trialActive: false, expiresAt: null };
  }

  const now = new Date();
  const trialEnds = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const expires = data.expires_at ? new Date(data.expires_at) : null;

  return {
    isActive: data.is_active,
    registrationPaid: data.registration_paid,
    trialActive: trialEnds ? now < trialEnds : false,
    expiresAt: data.expires_at,
  };
}

/**
 * Confirm a payment (admin action or webhook callback)
 */
export async function confirmPayment(paymentId: string, externalId?: string): Promise<boolean> {
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      external_id: externalId || null,
    })
    .eq('id', paymentId);

  return !error;
}
