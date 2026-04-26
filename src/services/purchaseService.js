import { apiClient } from '@/lib/api/apiClient';

export const purchaseService = {
  createPurchase: async (purchaseData) => {
    return apiClient('/api/purchase', { body: purchaseData });
  },

  checkEntitlement: async (materialId) => {
    return apiClient(`/api/entitlements?materialId=${materialId}`);
  },

  getPurchaseHistory: async () => {
    // Assuming /api/purchase with GET returns history
    return apiClient('/api/purchase');
  },
};
