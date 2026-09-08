import { useCallback, useMemo, useState } from 'react';
import { TABLE } from '@/constants';

/**
 * Quan ly page/pageSize/filter cho bang phan trang phia server. Dung chung cho MOI bang.
 *   const table = useTableQuery();
 *   const { data } = useQuery({ queryKey: [...QUERY_KEYS.USERS, table.params], queryFn: () => listUsers(table.params) });
 *   <Table pagination={table.paginationProps(data?.meta)} onChange={table.onTableChange} />
 * @param {object} [initialFilters]
 */
export const useTableQuery = (initialFilters = {}) => {
  const [page, setPage] = useState(TABLE.DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(TABLE.DEFAULT_PAGE_SIZE);
  const [filters, setFiltersState] = useState(initialFilters);

  const params = useMemo(() => ({ page, pageSize, ...filters }), [page, pageSize, filters]);

  /** Doi filter thi ve trang 1 */
  const setFilters = useCallback((next) => {
    setFiltersState((prev) => ({ ...prev, ...next }));
    setPage(TABLE.DEFAULT_PAGE);
  }, []);

  const onTableChange = useCallback((pagination) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
  }, []);

  /** @param {{ total?: number } | undefined} meta */
  const paginationProps = useCallback(
    (meta) => ({
      current: page,
      pageSize,
      total: meta?.total ?? 0,
      showSizeChanger: true,
      pageSizeOptions: TABLE.PAGE_SIZE_OPTIONS,
      showTotal: (total) => `Tổng ${total}`,
    }),
    [page, pageSize],
  );

  return { params, filters, setFilters, onTableChange, paginationProps };
};
