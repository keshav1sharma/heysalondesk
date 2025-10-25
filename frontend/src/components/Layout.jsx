import { Layout as AntLayout, Menu, Badge } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

export const Layout = ({ children, pendingCount = 0 }) => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/requests/pending',
      icon: <QuestionCircleOutlined />,
      label: (
        <Link to="/requests/pending">
          Pending Requests
          {pendingCount > 0 && (
            <Badge count={pendingCount} style={{ marginLeft: 8 }} />
          )}
        </Link>
      ),
    },
    {
      key: '/requests/resolved',
      icon: <CheckCircleOutlined />,
      label: <Link to="/requests/resolved">Resolved Requests</Link>,
    },
    {
      key: '/requests/unresolved',
      icon: <CloseCircleOutlined />,
      label: <Link to="/requests/unresolved">Unresolved Requests</Link>,
    },
    {
      key: '/knowledge-base',
      icon: <BookOutlined />,
      label: <Link to="/knowledge-base">Knowledge Base</Link>,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          💇 HeySalonDesk HITL - Supervisor Dashboard
        </div>
      </Header>
      <AntLayout>
        <Sider width={250} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
