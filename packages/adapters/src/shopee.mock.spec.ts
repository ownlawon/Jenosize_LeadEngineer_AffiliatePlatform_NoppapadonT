import { shopeeMockAdapter } from './shopee.mock';

describe('shopeeMockAdapter', () => {
  describe('parseUrl', () => {
    it('parses the canonical /product/:shopId/:slug URL', () => {
      expect(
        shopeeMockAdapter.parseUrl('https://shopee.co.th/product/123456/matcha-001'),
      ).toEqual({ externalId: 'matcha-001' });
    });

    it('parses the alternate slug-i.shopId.itemId URL shape', () => {
      expect(
        shopeeMockAdapter.parseUrl('https://shopee.co.th/yoga-mat-77-i.4321.99'),
      ).toEqual({ externalId: 'yoga-mat-77' });
    });

    it('accepts a raw SKU/externalId', () => {
      expect(shopeeMockAdapter.parseUrl('matcha-001')).toEqual({
        externalId: 'matcha-001',
      });
    });

    it('rejects a Lazada URL', () => {
      expect(
        shopeeMockAdapter.parseUrl('https://www.lazada.co.th/products/foo.html'),
      ).toBeNull();
    });

    it('handles an empty input', () => {
      expect(shopeeMockAdapter.parseUrl('')).toBeNull();
    });
  });

  describe('fetchProduct', () => {
    it('returns a product from fixtures with realistic Thai pricing', async () => {
      const product = await shopeeMockAdapter.fetchProduct('matcha-001');
      expect(product.externalId).toBe('matcha-001');
      expect(product.title).toContain('Matcha');
      expect(product.url).toMatch(/shopee\.co\.th/);
      expect(product.currency).toBe('THB');
      expect(product.price).toBeGreaterThan(0);
    });

    it('throws AdapterError for an unknown externalId', async () => {
      await expect(shopeeMockAdapter.fetchProduct('does-not-exist')).rejects.toThrow(
        /not found in fixtures/i,
      );
    });

    it('applies a small price drift each call so cron updates are observable', async () => {
      // Call 50× and assert we see at least two distinct prices around the
      // base — verifies the ±5% randomisation that the cron job relies on.
      const prices = new Set<number>();
      for (let i = 0; i < 50; i++) {
        const p = await shopeeMockAdapter.fetchProduct('matcha-001');
        prices.add(p.price);
      }
      expect(prices.size).toBeGreaterThan(1);
    });
  });
});
