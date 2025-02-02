'use client';

import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Drawer, Form, Select, InputNumber, Space, message, Tag, Flex } from 'antd';

import api from '@/api';
import DynamicBreadcrumb from '@/components/dynamicBreadcrumb';
import withAuth from '@/hooks/withAuth';

const { Option } = Select;

interface Product {
  id: number;
  name: string;
  price: number;
  stock_quantity: number;
}

const Page: React.FC = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [form] = Form.useForm();

  // Fetch orders from the API
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Fetch products from the API
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch {
      message.error('Failed to load products');
    }
  }, [api]);

  // Handle form submission for creating or updating orders
  const handleSubmit = async (values: any) => {
    const payload = {
      status: values.status,
      items: values.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    };

    try {
      if (selectedOrder) {
        await api.put(`/orders/${selectedOrder.id}`, payload);
        message.success('Order updated successfully');
      } else {
        await api.post('/orders', payload);
        message.success('Order created successfully');
      }

      form.resetFields();
      setDrawerVisible(false);
      fetchOrders();
    } catch {
      message.error('Failed to save order');
    }
  };

  // Open the drawer for creating or editing an order
  const openDrawer = (order: any = null) => {
    setSelectedOrder(order);
    if (order) {
      form.setFieldsValue({
        status: order.status,
        items: order.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [fetchOrders, fetchProducts]);

  const columns = [
    { title: 'Order ID', dataIndex: 'id', key: 'id' },
    { title: 'Total Price', dataIndex: 'total_price', key: 'total_price' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'volcano'}>{status}</Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <ul>
          {items.map((item) => (
            <li key={item.product_id}>
              {item.product.name} (x{item.quantity})
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Actions',
      render: (order: any) => (
        <Space>
          <Button type="link" onClick={() => openDrawer(order)}>
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Flex
        align='start'
        justify='space-between'
      >
        <DynamicBreadcrumb />

        <Button type="primary" onClick={() => openDrawer()} className="d-block mb-4 ml-auto">
          Create
        </Button>
      </Flex>

      <Table dataSource={orders} columns={columns} rowKey="id" loading={loading} />

      <Drawer
        title={selectedOrder ? 'Edit Order' : 'Create Order'}
        width={600}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="status" label="Order Status" rules={[{ required: true }]}>
            <Select placeholder="Select status">
              <Option value="pending">Pending</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'product_id']}
                      rules={[{ required: true, message: 'Select a product' }]}
                    >
                      <Select placeholder="Select product" style={{ width: 200 }}>
                        {products.map((product) => (
                          <Option key={product.id} value={product.id}>
                            {product.name} (Stock: {product.stock_quantity})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Enter quantity' }]}
                    >
                      <InputNumber min={1} placeholder="Quantity" />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block>
                  Add Product
                </Button>
              </>
            )}
          </Form.List>

          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedOrder ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
};

export default withAuth(Page);