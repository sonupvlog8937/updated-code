import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateGoMarketFees, isGoMarketOrder } from './goMarketPricing.js';

test('calculates go market fees from distance and admin settings', () => {
  const settings = {
    goMarketShippingFee: 25,
    goMarketDeliveryFeePerKm: 8,
    freeShippingAbove: 500,
  };

  const result = calculateGoMarketFees({
    settings,
    subtotal: 340,
    distanceKm: 4.5,
    isFirstOrder: false,
  });

  assert.equal(result.shippingFee, 25);
  assert.equal(result.deliveryFee, 36);
  assert.equal(result.total, 401);
});

test('waives go market fees when free shipping threshold is reached', () => {
  const settings = {
    goMarketShippingFee: 25,
    goMarketDeliveryFeePerKm: 8,
    freeShippingAbove: 500,
  };

  const result = calculateGoMarketFees({
    settings,
    subtotal: 600,
    distanceKm: 4.5,
    isFirstOrder: false,
  });

  assert.equal(result.shippingFee, 0);
  assert.equal(result.deliveryFee, 0);
  assert.equal(result.total, 600);
});

test('detects go market orders from cart items', () => {
  assert.equal(isGoMarketOrder([{ source: 'goMarket' }]), true);
  assert.equal(isGoMarketOrder([{ brand: 'GoMarket' }]), true);
  assert.equal(isGoMarketOrder([{ brand: 'Zeedaddy' }]), false);
  // Test seller type detection
  assert.equal(isGoMarketOrder([{ sellerId: { storeProfile: { marketId: '123' } } }]), true);
  assert.equal(isGoMarketOrder([{ sellerId: { storeProfile: { goMarketOwnerId: '456' } } }]), true);
  assert.equal(isGoMarketOrder([{ sellerId: { storeProfile: { } } }]), false);
});
