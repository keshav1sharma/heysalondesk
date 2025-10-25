
import { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { KnowledgeBaseTable } from '../components/KnowledgeBaseTable';
import { knowledgeBaseAPI } from '../services/api';

const { TextArea } = Input;

export const KnowledgeBase = () => {
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const response = await knowledgeBaseAPI.getAll();
      setKnowledge(response.data.data);
    } catch (error) {
      message.error('Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, []);

  const handleAdd = async (values) => {
    try {
      await knowledgeBaseAPI.create(values);
      message.success('Knowledge entry added!');
      setModalVisible(false);
      form.resetFields();
      loadKnowledge();
    } catch (error) {
      message.error('Failed to add entry');
    }
  };

  const handleDelete = async (id) => {
    try {
      await knowledgeBaseAPI.delete(id);
      message.success('Knowledge entry deleted!');
      loadKnowledge();
    } catch (error) {
      message.error('Failed to delete entry');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>Knowledge Base ({knowledge.length})</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          Add Entry
        </Button>
      </div>

      <KnowledgeBaseTable
        data={knowledge}
        loading={loading}
        onDelete={handleDelete}
      />

      <Modal
        title="Add Knowledge Entry"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            label="Question"
            name="question"
            rules={[{ required: true, message: 'Please enter a question' }]}
          >
            <Input placeholder="What is...?" />
          </Form.Item>

          <Form.Item
            label="Answer"
            name="answer"
            rules={[{ required: true, message: 'Please enter an answer' }]}
          >
            <TextArea rows={4} placeholder="The answer is..." />
          </Form.Item>

          <Form.Item label="Category" name="category" initialValue="other">
            <Select>
              <Select.Option value="hours">Hours</Select.Option>
              <Select.Option value="services">Services</Select.Option>
              <Select.Option value="pricing">Pricing</Select.Option>
              <Select.Option value="location">Location</Select.Option>
              <Select.Option value="booking">Booking</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Entry
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
