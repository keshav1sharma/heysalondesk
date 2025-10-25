import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { dashboardAPI } from '../services/api';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats?.helpRequests?.pending || 0}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Resolved Today"
              value={stats?.helpRequests?.totalToday || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Resolved"
              value={stats?.helpRequests?.resolved || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Knowledge Base"
              value={stats?.knowledgeBase?.total || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Response Time">
            <Statistic
              title="Average"
              value={stats?.responseTime?.average || 'N/A'}
              suffix=""
            />
            <Statistic
              title="Median"
              value={stats?.responseTime?.median || 'N/A'}
              suffix=""
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Knowledge Base Stats">
            <Statistic
              title="Total Entries"
              value={stats?.knowledgeBase?.total || 0}
            />
            <Statistic
              title="Learned Entries"
              value={stats?.knowledgeBase?.learned || 0}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 16 }}>
              <strong>Most Used:</strong>
              <div>{stats?.knowledgeBase?.mostUsed || 'N/A'}</div>
              <div style={{ color: '#999' }}>
                Used {stats?.knowledgeBase?.mostUsedCount || 0} times
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
