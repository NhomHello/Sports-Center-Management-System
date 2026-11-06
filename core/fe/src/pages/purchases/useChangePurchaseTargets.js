import { useQuery } from '@tanstack/react-query';
import { TABLE } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { getClass, listClasses } from '@/services/schedule.service';

const subjectOf = (response) => response?.data?.subjectId;
const rowsOf = (response) => (Array.isArray(response?.data) ? response.data : []);

/** Load the source subject before requesting a paginated list of equivalent target courses. */
export function useChangePurchaseTargets({ kind, currentId, memberId, search, page }) {
  const { user } = useAuth();
  const assisted = memberId !== user?.id ? { memberId } : {};
  const source = useQuery({
    queryKey: ['purchase', 'source-class', user?.id, currentId, memberId],
    queryFn: () => getClass(currentId, assisted),
    enabled: Boolean(currentId),
  });
  const subjectId = subjectOf(source.data);
  const params = { page, pageSize: TABLE.DEFAULT_PAGE_SIZE, search, subjectId };
  const targets = useQuery({
    queryKey: ['purchase', 'targets', user?.id, kind, memberId, params],
    queryFn: () => listClasses({ ...params, status: 'OPEN', ...assisted }),
    enabled: Boolean(subjectId),
    retry: false,
  });
  return {
    rows: rowsOf(targets.data),
    error: source.error || targets.error,
    unavailable: [source.isError, !subjectId, targets.isError, targets.isFetching].some(Boolean),
    isFetching: source.isFetching || targets.isFetching,
    refetch: source.isError ? source.refetch : targets.refetch,
  };
}
