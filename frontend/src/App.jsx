import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PendingRequests } from './pages/PendingRequests';
import { ResolvedRequests } from './pages/ResolvedRequests';
import { UnresolvedRequests } from './pages/UnresolvedRequests';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { useEffect, useState } from 'react';
import { helpRequestsAPI } from './services/api';

function App() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const response = await helpRequestsAPI.getAll({ status: 'pending' });
        setPendingCount(response.data.data.length);
      } catch (error) {
        console.error('Failed to load pending count:', error);
      }
    };

    loadPendingCount();
    const interval = setInterval(loadPendingCount, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#722ed1',
        },
      }}
    >
      <Router>
        <Layout pendingCount={pendingCount}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/requests/pending" element={<PendingRequests />} />
            <Route path="/requests/resolved" element={<ResolvedRequests />} />
            <Route path="/requests/unresolved" element={<UnresolvedRequests />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
