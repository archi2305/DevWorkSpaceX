import { useQuery } from '@tanstack/react-query'
import { dashboardUnifiedService } from '@/services/dashboardUnified'

export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardUnifiedService.getDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    refetchOnWindowFocus: true,
  })
}
