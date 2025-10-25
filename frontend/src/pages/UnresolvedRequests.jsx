import { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Modal, Typography } from 'antd';
import { EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { helpRequestsAPI } from '../services/api';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

export const UnresolvedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const loadRequests = async (page = 1) => {
    setLoading(true);
    try {
      const response = await helpRequestsAPI.getAll({
        status: 'unresolved',
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

  const showDetails = (request) => {
    setSelectedRequest(request);
    setDetailsVisible(true);
  };

  const getTimeoutReason = (request) => {
    if (request.supervisorNotes?.includes('Auto-timeout')) {
      return 'Timeout (30 minutes expired)';
    }
    return request.supervisorNotes || 'Marked as unresolved';
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
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
      title: 'Reason',
      dataIndex: 'supervisorNotes',
      key: 'reason',
      width: '25%',
      ellipsis: true,
      render: (_, record) => getTimeoutReason(record),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '12%',
      render: (date) => dayjs(date).format('MMM D, h:mm A'),
    },
    {
      title: 'Resolved At',
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      width: '12%',
      render: (date) => dayjs(date).format('MMM D, h:mm A'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => <Tag color="red">UNRESOLVED</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '8%',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetails(record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Unresolved Requests</h1>
        <Text type="secondary">
          Requests that timed out or were marked as unresolved
        </Text>
      </div>

      <Table
        columns={columns}
        dataSource={requests}
        loading={loading}
        rowKey="_id"
        pagination={{
          ...pagination,
          onChange: loadRequests,
          showTotal: (total) => `Total ${total} unresolved requests`,
        }}
      />

      <Modal
        title="Unresolved Request Details"
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedRequest && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Question:</Text>
              <Paragraph>{selectedRequest.question}</Paragraph>
            </div>

            <div>
              <Text strong>Customer Phone:</Text>
              <Paragraph copyable>{selectedRequest.customerPhone}</Paragraph>
            </div>

            {selectedRequest.customerContext && (
              <div>
                <Text strong>Context:</Text>
                <Paragraph>{selectedRequest.customerContext}</Paragraph>
              </div>
            )}

            <div>
              <Text strong>Reason:</Text>
              <Paragraph>
                <Tag color="red" icon={<CloseCircleOutlined />}>
                  {getTimeoutReason(selectedRequest)}
                </Tag>
              </Paragraph>
            </div>

            <div>
              <Text strong>Created At:</Text>
              <Paragraph>
                {dayjs(selectedRequest.createdAt).format('MMMM D, YYYY h:mm A')}
              </Paragraph>
            </div>

            <div>
              <Text strong>Marked Unresolved At:</Text>
              <Paragraph>
                {dayjs(selectedRequest.resolvedAt).format('MMMM D, YYYY h:mm A')}
              </Paragraph>
            </div>

            <div>
              <Text strong>Time Elapsed:</Text>
              <Paragraph>
                {dayjs(selectedRequest.resolvedAt).diff(
                  dayjs(selectedRequest.createdAt),
                  'minute'
                )}{' '}
                minutes
              </Paragraph>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};
