import { Form, Input, Select, Button, Space, message } from 'antd';
import { useState } from 'react';
import { helpRequestsAPI } from '../services/api';

const { TextArea } = Input;

export const AnswerForm = ({ request, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await helpRequestsAPI.resolve(request._id, values);
      message.success('Request resolved and added to knowledge base!');
      form.resetFields();
      if (onSuccess) onSuccess();
    } catch (error) {
      message.error('Failed to resolve request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ category: 'other' }}
    >
      <Form.Item
        label="Answer"
        name="answer"
        rules={[{ required: true, message: 'Please provide an answer' }]}
      >
        <TextArea
          rows={4}
          placeholder="Type your answer here..."
          onChange={(e) => setCharCount(e.target.value.length)}
          showCount
          maxLength={500}
        />
      </Form.Item>

      <Form.Item label="Category" name="category">
        <Select>
          <Select.Option value="hours">Hours</Select.Option>
          <Select.Option value="services">Services</Select.Option>
          <Select.Option value="pricing">Pricing</Select.Option>
          <Select.Option value="location">Location</Select.Option>
          <Select.Option value="booking">Booking</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="Supervisor Notes (Optional)" name="supervisorNotes">
        <TextArea rows={2} placeholder="Internal notes..." />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Answer
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
