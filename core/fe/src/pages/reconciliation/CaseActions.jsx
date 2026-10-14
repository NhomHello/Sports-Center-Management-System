import { CASE_REASON } from '@/constants/reconciliation';
import { CaseMapForm } from './CaseMapForm';
import { CaseContacts } from './CaseContacts';
import { CaseConfirmForm } from './CaseConfirmForm';
import { CaseExcessForm } from './CaseExcessForm';
/** Thao tác theo trạng thái server trả về. */
export function CaseActions({ item, active, mutation }) {
  const id = item.id;
  return (
    <>
      {active && [CASE_REASON.NO_MATCH, CASE_REASON.LATE].includes(item.reason) && (
        <CaseMapForm pending={mutation.isPending} onAction={mutation.mutateAsync} />
      )}
      <CaseContacts
        item={item}
        active={active}
        pending={mutation.isPending}
        onAction={mutation.mutateAsync}
      />
      {active && [CASE_REASON.MEMBER_CLAIM, CASE_REASON.UNDERPAID].includes(item.reason) && (
        <CaseConfirmForm
          key={id}
          pending={mutation.isPending}
          onSubmit={(data) => mutation.mutate({ action: 'confirm', data })}
        />
      )}
      {active && [CASE_REASON.OVERPAID, CASE_REASON.DUPLICATE_TRANSFER].includes(item.reason) && (
        <CaseExcessForm item={item} pending={mutation.isPending} onAction={mutation.mutateAsync} />
      )}
    </>
  );
}
