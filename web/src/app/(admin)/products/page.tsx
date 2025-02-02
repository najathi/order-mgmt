'use client';

import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Drawer, Form, Input, message, Space, Flex } from 'antd';

import DynamicBreadcrumb from '@/components/dynamicBreadcrumb';
import withAuth from '@/hooks/withAuth';
import api from '@/api';

const Page: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [form] = Form.useForm();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const handleSubmit = async (values: any) => {
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, values);
        message.success('Product updated successfully');
      } else {
        await api.post('/products', values);
        message.success('Product created successfully');
      }
      form.resetFields();
      setDrawerVisible(false);
      fetchProducts();
    } catch {
      message.error('Failed to save product');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch {
      message.error('Failed to delete product');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    { title: 'Stock', dataIndex: 'stock_quantity', key: 'stock_quantity' },
    {
      title: 'Actions',
      render: (product: any) => (
        <Space>
          <Button type="link" onClick={() => openDrawer(product)}>Edit</Button>
          <Button type="link" danger onClick={() => handleDelete(product.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const openDrawer = (product: any = null) => {
    setSelectedProduct(product);
    if (product) form.setFieldsValue(product);
    else form.resetFields();
    setDrawerVisible(true);
  };

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

      <Table dataSource={products} columns={columns} rowKey="id" loading={loading} />

      <Drawer
        title={selectedProduct ? 'Edit Product' : 'Create Product'}
        width={400}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{
          body: { paddingBottom: 80 }
        }}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="stock_quantity" label="Stock Quantity" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedProduct ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
};

export default withAuth(Page);
