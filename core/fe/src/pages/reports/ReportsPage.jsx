import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Select,
  Space,
  Statistic,
  Table,
} from 'antd';
import { vietnamInput } from '@/utils/schedule';
import { PageHeader } from '@/components/common/PageHeader';
import { DATE_FORMATS } from '@/constants';
import { getReport, exportReport } from '@/services/sprint3.service';
import { ReportResults } from './ReportResults';
import { QueryState } from '../schedule/QueryState';

/** Dashboard và tệp xuất dùng cùng bộ lọc đã áp dụng, không tính lại tiền ở client. */
export default function ReportsPage() {
  const { message } = App.useApp();
  const today = vietnamInput(new Date());
  const [filters, setFilters] = useState({
    from: today.startOf('month').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  });
  const [format, setFormat] = useState('xlsx');
  const query = useQuery({ queryKey: ['reports', filters], queryFn: () => getReport(filters) });
  const download = useMutation({
    mutationFn: () => exportReport({ ...filters, format }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${filters.from}-${filters.to}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => message.error(e.message),
  });
  const report = query.data?.data;
  return (
    <>
      <PageHeader
        title="Báo cáo trung tâm"
        subtitle="Doanh thu theo ngày thanh toán, trừ tiền đã hoàn · Giờ Việt Nam"
      />
      <Card>
        <Form
          layout="inline"
          initialValues={{ range: [today.startOf('month'), today] }}
          onFinish={({ range, ...values }) =>
            setFilters({
              ...values,
              from: range[0].format('YYYY-MM-DD'),
              to: range[1].format('YYYY-MM-DD'),
            })
          }
        >
          <Form.Item name="range" label="Khoảng ngày" rules={[{ required: true }]}>
            <DatePicker.RangePicker format={DATE_FORMATS.DATE} />
          </Form.Item>
          <Form.Item name="planId" label="Mã gói">
            <InputNumber min={1} precision={0} />
          </Form.Item>
          <Form.Item name="memberId" label="Mã hội viên">
            <InputNumber min={1} precision={0} />
          </Form.Item>
          <Button htmlType="submit" type="primary">
            Áp dụng
          </Button>
        </Form>
      </Card>
      <QueryState query={query}>
        {report && (
          <ReportResults
            report={report}
            format={format}
            setFormat={setFormat}
            download={download}
          />
        )}
      </QueryState>
    </>
  );
}
