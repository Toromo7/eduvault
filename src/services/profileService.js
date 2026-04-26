import { apiClient } from '@/lib/api/apiClient';

export const profileService = {
  getProfile: async (address) => {
    return apiClient(`/api/profile?address=${address}`);
  },

  createProfile: async (profileData) => {
    return apiClient('/api/profile', { body: profileData });
  },

  // Note: Latest activity might be part of the profile or a separate endpoint
  // Based on current structure, it seems to be fetched in the dashboard.
};
