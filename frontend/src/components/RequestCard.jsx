import { Card, Tag, Button, Space, Typography } from 'antd';
import { ClockCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

export const RequestCard = ({ request, onAnswer, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'resolved':
        return 'green';
      case 'unresolved':
        return 'red';
      default:
        return 'default';
    }
  };

  const timeRemaining = dayjs(request.timeoutAt).diff(dayjs(), 'minute');
  const isUrgent = timeRemaining < 10 && request.status === 'pending';

  return (
    <Card
      style={{
        marginBottom: 16,
        borderLeft: isUrgent ? '4px solid #ff4d4f' : undefined,
      }}
      hoverable
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Tag color={getStatusColor(request.status)}>
            {request.status.toUpperCase()}
          </Tag>
          {request.status === 'pending' && (
            <Text type={isUrgent ? 'danger' : 'secondary'}>
              <ClockCircleOutlined /> {timeRemaining > 0 ? `${timeRemaining}m left` : 'Overdue'}
            </Text>
          )}
        </div>

        <Paragraph strong style={{ marginBottom: 8, fontSize: 16 }}>
          {request.question}
        </Paragraph>

        <Space>
          <PhoneOutlined />
          <Text type="secondary">{request.customerPhone}</Text>
        </Space>

        {request.customerContext && (
          <Text type="secondary" italic>
            Context: {request.customerContext}
          </Text>
        )}

        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(request.createdAt).fromNow()}
        </Text>

        <Space style={{ marginTop: 8 }}>
          {request.status === 'pending' && (
            <Button type="primary" onClick={() => onAnswer(request)}>
              Answer
            </Button>
          )}
          <Button onClick={() => onView(request)}>View Details</Button>
        </Space>
      </Space>
    </Card>
  );
};
