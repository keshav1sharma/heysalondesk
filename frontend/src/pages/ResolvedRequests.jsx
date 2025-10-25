import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { helpRequestsAPI } from '../services/api';
import dayjs from 'dayjs';

export const ResolvedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const loadRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await helpRequestsAPI.getAll({
        status: 'resolved',
        page,
        limit: pagination.pageSize,
      });
      setRequests(response.data.data);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.pagination.total,
      });
    } catch (error) {
      message.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      width: '25%',
      ellipsis: true,
    },
    {
      title: 'Answer',
      dataIndex: 'answer',
      key: 'answer',
      width: '30%',
      ellipsis: true,
    },
    {
      title: 'Customer',
      dataIndex: 'customerPhone',
      key: 'customerPhone',
      width: '15%',
    },
    {
      title: 'Resolved At',
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      width: '15%',
      render: (date) => dayjs(date).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => <Tag color="green">RESOLVED</Tag>,
    },
  ];

  return (
    <div>
      <h1>Resolved Requests</h1>

      <Table
        columns={columns}
        dataSource={requests}
        loading={loading}
        rowKey="_id"
        pagination={{
          ...pagination,
          onChange: loadRequests,
          showTotal: (total) => `Total ${total} requests`,
        }}
      />
    </div>
  );
};
