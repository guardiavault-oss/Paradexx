import { stripeStorage } from './storage';
import { getUncachableStripeClient } from './stripeClient';

export class StripeService {
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  async createCheckoutSession(options: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    mode: 'subscription' | 'payment';
    metadata?: Record<string, string>;
  }) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: options.customerId,
      payment_method_types: ['card'],
      line_items: [{ price: options.priceId, quantity: 1 }],
      mode: options.mode,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    return await stripeStorage.getProduct(productId);
  }

  async getSubscription(subscriptionId: string) {
    return await stripeStorage.getSubscription(subscriptionId);
  }

  async listProducts() {
    return await stripeStorage.listProducts();
  }

  async listProductsWithPrices() {
    return await stripeStorage.listProductsWithPrices();
  }

  async listPrices() {
    return await stripeStorage.listPrices();
  }

  async cancelSubscription(subscriptionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

export const stripeService = new StripeService();
