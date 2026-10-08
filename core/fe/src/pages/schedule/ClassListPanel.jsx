import { PERMISSIONS as P } from '@scms/shared';
import { Pagination } from 'antd';
import { ClassCard } from './ClassCard';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { ClassFormModal } from './ClassFormModal';
import { QueryState } from './QueryState';
import { ClassEmptyState } from './ClassEmptyState';
import { ClassListToolbar } from './ClassListToolbar';
import { useClassList } from './useClassList';

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
      <ClassListToolbar
        search={search}
        onSearchChange={setSearch}
        onSearch={(value) => table.setFilters({ search: value.trim() || undefined })}
        onCreate={can(P.CLASS_CREATE) ? () => setEditing({}) : undefined}
      />
      {renderFilters?.(table)}
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
              >
                {renderActions?.(item)}
              </ClassCard>
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
