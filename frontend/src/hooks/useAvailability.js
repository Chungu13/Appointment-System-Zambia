import { useQuery } from '@apollo/client/react'
import { AVAILABILITY } from '../graphql/queries/services'

export function useAvailability(serviceId, date, staffId = null) {
  const skip = !serviceId || !date

  const { data, loading, error, refetch } = useQuery(AVAILABILITY, {
    variables: { serviceId, date, staffId },
    skip,
    fetchPolicy: 'network-only',
  })

  return {
    slots: data?.availability ?? [],
    loading,
    error,
    refetch,
  }
}
