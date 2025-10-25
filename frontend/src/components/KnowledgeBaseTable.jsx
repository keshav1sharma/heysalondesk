import { Table, Tag, Button, Space, Input, Select, message } from 'antd';
import { SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';

const { Search } = Input;

export const KnowledgeBaseTable = ({ data, loading, onDelete, onEdit }) => {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      width: '30%',
      ellipsis: true,
    },
    {
      title: 'Answer',
      dataIndex: 'answer',
      key: 'answer',
      width: '35%',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '10%',
      render: (category) => (
        <Tag color="blue">{category.toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'Hours', value: 'hours' },
        { text: 'Services', value: 'services' },
        { text: 'Pricing', value: 'pricing' },
        { text: 'Location', value: 'location' },
        { text: 'Booking', value: 'booking' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: '10%',
      render: (source) => (
        <Tag color={source === 'initial' ? 'green' : 'orange'}>
          {source.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Usage',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: '8%',
      sorter: (a, b) => a.usageCount - b.usageCount,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit && onEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete && onDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  const filteredData = data?.filter((item) =>
    item.question.toLowerCase().includes(searchText.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search questions or answers..."
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={setSearchText}
          style={{ width: 300 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} entries`,
        }}
      />
    </div>
  );
};
