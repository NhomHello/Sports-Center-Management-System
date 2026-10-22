import { PERMISSIONS as P } from '@scms/shared';
import { useState } from 'react';
import { Pagination } from 'antd';
import { ClassCard } from './ClassCard';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { ClassFormModal } from './ClassFormModal';
import { QueryState } from './QueryState';
import { ClassEmptyState } from './ClassEmptyState';
import { ClassListToolbar } from './ClassListToolbar';
import { useClassList } from './useClassList';

function ClassResultCount({ query }) {
  if (!query.isSuccess) return null;
  return (
    <p className="scms-class-results" role="status">
      {query.data?.meta?.total ?? 0} lớp học phù hợp
    </p>
  );
}

function ListHeader({ search, setSearch, table, can, setEditing, renderFilters }) {
  const filterCount = ['date', 'status', 'subjectId', 'coachId'].filter(
    (key) => table.params[key],
  ).length;
  const [filtersOpen, setFiltersOpen] = useState(filterCount > 0);
  return (
    <div className="scms-class-search-filters">
      <ClassListToolbar
        search={search}
        onSearchChange={setSearch}
        onSearch={(value) => table.setFilters({ search: value.trim() || undefined })}
        onCreate={can(P.CLASS_CREATE) ? () => setEditing({}) : undefined}
        filters={
          renderFilters
            ? {
                open: filtersOpen,
                count: filterCount,
                toggle: () => setFiltersOpen((open) => !open),
              }
            : null
        }
      />
      {filtersOpen && renderFilters?.(table)}
    </div>
  );
}

/** Container danh sách lớp mở; scope management và action dùng chung với FE Khôi. */
export function ClassListPanel({
  scope = 'open',
  memberId,
  renderActions,
  renderFilters,
  onViewSchedule,
}) {
  const {
    can,
    table,
    query,
    hasPages,
    cancel,
    items,
    filtered,
    reset,
    detailId,
    setDetailId,
    editing,
    setEditing,
    search,
    setSearch,
  } = useClassList({ scope, memberId });
  return (
    <div className="scms-schedule-stack scms-class-list-panel">
      <ListHeader {...{ search, setSearch, table, can, setEditing, renderFilters }} />
      <ClassResultCount query={query} />
      <QueryState query={query}>
        {items.length ? (
          <div className="scms-class-grid">
            {items.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                can={can}
                onDetail={() => setDetailId(item.id)}
                onEdit={() => setEditing(item)}
                onCancel={() => cancel.mutate(item.id)}
                loading={cancel.isPending}
                renderActions={renderActions}
              />
            ))}
          </div>
        ) : (
          <ClassEmptyState
            scope={scope}
            filtered={filtered}
            onReset={reset}
            onViewSchedule={onViewSchedule}
          />
        )}
      </QueryState>
      {hasPages && (
        <Pagination
          className="scms-class-pagination"
          {...table.paginationProps(query.data?.meta)}
          onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
        />
      )}
      {detailId && (
        <ClassDetailDrawer
          id={detailId}
          memberId={memberId}
          onClose={() => setDetailId(null)}
          renderActions={renderActions}
        />
      )}
      {editing && (
        <ClassFormModal item={editing.id ? editing : null} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
