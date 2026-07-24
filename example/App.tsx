import {
  DataTable,
  DataTableHandle,
  SortParams,
  TableColumn,
} from '@bestcoder/react-native-data-table';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

interface Order {
  id: string;
  name: string;
  category: string;
  amount: number;
  status: '已完成' | '进行中' | '已取消';
}

const CATEGORIES = ['数码', '家居', '服饰', '食品'];
const STATUSES: Order['status'][] = ['已完成', '进行中', '已取消'];

const ORDERS: Order[] = Array.from({ length: 60 }, (_, i) => ({
  id: `order-${i + 1}`,
  name: `订单 ${i + 1} 号商品`,
  category: CATEGORIES[i % CATEGORIES.length],
  amount: Math.round(((i * 37) % 500) * 100) / 100 + 10,
  status: STATUSES[i % STATUSES.length],
}));

const STATUS_COLOR: Record<Order['status'], string> = {
  已完成: '#16a34a',
  进行中: '#2563eb',
  已取消: '#9ca3af',
};

export default function App() {
  const tableRef = useRef<DataTableHandle>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sort, setSort] = useState<SortParams>({ dataIndex: '', order: null });

  const columns = useMemo<TableColumn<Order>[]>(
    () => [
      { title: '商品名称', dataIndex: 'name', fixed: 'left', minWidth: 120 },
      { title: '分类', dataIndex: 'category', align: 'center' },
      {
        title: '金额',
        dataIndex: 'amount',
        align: 'right',
        sorter: true,
        render: (record) => (
          <Text style={styles.amount}>¥{record.amount.toFixed(2)}</Text>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        align: 'center',
        render: (record) => (
          <Text style={{ color: STATUS_COLOR[record.status] }}>{record.status}</Text>
        ),
      },
    ],
    [],
  );

  const data = useMemo(() => {
    if (sort.dataIndex !== 'amount' || !sort.order) return ORDERS;
    const sorted = [...ORDERS].sort((a, b) => a.amount - b.amount);
    return sort.order === 'ascend' ? sorted : sorted.reverse();
  }, [sort]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>DataTable 示例</Text>
      <Text style={styles.subtitle}>已选 {selectedKeys.length} 行 · 点击「金额」表头排序 · 点击行展开详情</Text>
      <DataTable<Order>
        ref={tableRef}
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        striped
        maxHeight="100%"
        rowSelection={{
          selectedRowKeys: selectedKeys,
          onChange: (keys) => setSelectedKeys(keys),
        }}
        onSort={(params) => {
          setSort(params);
          tableRef.current?.scrollToTop();
        }}
        currentSort={sort}
        renderExpandedRow={(record) => (
          <View style={styles.expanded}>
            <Text>订单号：{record.id}</Text>
            <Text>
              {record.name} / {record.category} / ¥{record.amount.toFixed(2)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
  expanded: {
    padding: 12,
    gap: 4,
    backgroundColor: '#f9fafb',
  },
});
