import { useEffect, useState, useCallback } from 'react';
import { Modal, message, Empty, Spin } from 'antd';
import { RequestCard } from '../components/RequestCard';
import { AnswerForm } from '../components/AnswerForm';
import { helpRequestsAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

export const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const response = await helpRequestsAPI.getAll({ status: 'pending' });
      setRequests(response.data.data);
    } catch (error) {
      message.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // WebSocket handlers with useCallback to prevent recreating on every render
  const handleNewRequest = useCallback((data) => {
    message.info('New help request received!');
    loadRequests();
  }, [loadRequests]);

  const handleRequestResolved = useCallback((data) => {
    loadRequests();
  }, [loadRequests]);

  // WebSocket for real-time updates
  useWebSocket(handleNewRequest, handleRequestResolved, null);

  const handleAnswer = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleSuccess = () => {
    setModalVisible(false);
    setSelectedRequest(null);
    loadRequests();
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
      <h1>Pending Requests ({requests.length})</h1>

      {requests.length === 0 ? (
        <Empty description="No pending requests" />
      ) : (
        requests.map((request) => (
          <RequestCard
            key={request._id}
            request={request}
            onAnswer={handleAnswer}
            onView={(req) => {
              setSelectedRequest(req);
              setModalVisible(true);
            }}
          />
        ))
      )}

      <Modal
        title={`Answer Request: ${selectedRequest?.question}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedRequest && (
          <AnswerForm
            request={selectedRequest}
            onSuccess={handleSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>
    </div>
  );
};
