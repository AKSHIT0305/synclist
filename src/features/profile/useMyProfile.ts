import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { selectUserId, useAuthStore } from '@/features/auth/authStore';

import { fetchMyProfile, updateMyProfile, type ProfileUpdate } from './profileApi';

export const profileQueryKey = (userId: string | null) => ['profile', userId] as const;

export function useMyProfile() {
  const userId = useAuthStore(selectUserId);
  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchMyProfile(userId as string),
    enabled: userId !== null,
  });
}

export function useUpdateMyProfile() {
  const userId = useAuthStore(selectUserId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => {
      if (!userId) throw new Error('Not signed in');
      return updateMyProfile(userId, patch);
    },
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey(userId), profile),
  });
}
