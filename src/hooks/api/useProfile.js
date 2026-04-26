import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { queryKeys } from '@/lib/query/queryKeys';

export function useUserProfile(address) {
  return useQuery({
    queryKey: queryKeys.profile.detail(address),
    queryFn: () => profileService.getProfile(address),
    enabled: !!address,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.createProfile,
    onSuccess: (data) => {
      if (data.user?.walletAddress) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.profile.detail(data.user.walletAddress) 
        });
      }
    },
  });
}
