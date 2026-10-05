import { describe, expect, it } from 'vitest';
import { INVOICE_STATUS } from '@/constants';
import { canCollectCash, canPrintInvoice, getInvoiceListErrorNotice } from './invoice';

describe('canPrintInvoice', () => {
  const centerName = 'Trung tâm thể thao';

  it('allows a paid invoice with export permission and center configuration', () => {
    expect(
      canPrintInvoice({
        invoice: { status: INVOICE_STATUS.PAID },
        canExport: true,
        centerName,
      }),
    ).toBe(true);
  });

  it.each([
    [
      'unpaid invoice',
      { invoice: { status: INVOICE_STATUS.PENDING }, canExport: true, centerName },
    ],
    [
      'missing permission',
      { invoice: { status: INVOICE_STATUS.PAID }, canExport: false, centerName },
    ],
    [
      'missing center name',
      { invoice: { status: INVOICE_STATUS.PAID }, canExport: true, centerName: '' },
    ],
  ])('blocks printing when there is %s', (_name, input) => {
    expect(canPrintInvoice(input)).toBe(false);
  });
});

describe('cash collection eligibility', () => {
  it('allows only permitted, pending counter invoices with a valid original amount', () => {
    expect(
      canCollectCash({
        invoice: { status: INVOICE_STATUS.PENDING, channel: 'COUNTER', amount: 500000 },
        canRecordCash: true,
      }),
    ).toBe(true);
  });
  it.each([
    [{ status: INVOICE_STATUS.PAID, channel: 'COUNTER', amount: 500000 }, true],
    [{ status: INVOICE_STATUS.PENDING, channel: 'ONLINE', amount: 500000 }, true],
    [{ status: INVOICE_STATUS.PENDING, channel: 'COUNTER', amount: 500000 }, false],
    [{ status: INVOICE_STATUS.PENDING, channel: 'COUNTER', amount: null }, true],
  ])('blocks unsafe collection', (invoice, canRecordCash) => {
    expect(canCollectCash({ invoice, canRecordCash })).toBe(false);
  });
});

describe('getInvoiceListErrorNotice', () => {
  it.each([
    [false, 'GET /invoices/me'],
    [true, 'GET /invoices'],
  ])('explains a missing list endpoint for read-all=%s', (canReadAll, endpoint) => {
    const notice = getInvoiceListErrorNotice(
      {
        status: 404,
        message: `Không tìm thấy ${endpoint}?page=1&pageSize=10`,
      },
      canReadAll,
    );

    expect(notice.type).toBe('warning');
    expect(notice.description).toContain(endpoint);
    expect(notice.retryable).toBe(false);
  });

  it('keeps retry for temporary API failures', () => {
    const notice = getInvoiceListErrorNotice({ status: 503, message: 'Máy chủ lỗi' }, false);

    expect(notice.type).toBe('error');
    expect(notice.message).toBe('Máy chủ lỗi');
    expect(notice.retryable).toBe(true);
  });
});
