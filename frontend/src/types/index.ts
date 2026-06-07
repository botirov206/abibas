export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export type UserRole =
  | 'ADMIN'
  | 'WAREHOUSE_OPERATOR'
  | 'PROCUREMENT'
  | 'QC_INSPECTOR'
  | 'MANAGER';

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  total_area_sqm: number | null;
  is_active: boolean;
}

export interface Zone {
  id: number;
  warehouse_id: number;
  name: string;
  zone_type: 'RECEIVING' | 'STORAGE' | 'SHIPPING' | 'QUARANTINE';
}

export interface Bin {
  id: number;
  zone_id: number;
  code: string;
  max_capacity: number;
  current_fill: number;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface Supplier {
  id: number;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  country: string;
  lead_time_days: number;
  is_active: boolean;
}

export interface ProductSpec {
  id: number;
  product_id: number;
  spec_name: string;
  spec_value: string;
}

export interface Product {
  id: number;
  name: string;
  part_number: string;
  category_id: number | null;
  description: string | null;
  unit_of_measure: string;
  reorder_point: number;
  reorder_qty: number;
  image_url: string | null;
  is_active: boolean;
  specs: ProductSpec[];
}

export type QualityStatus = 'QUARANTINE' | 'PASSED' | 'FAILED' | 'RELEASED';

export interface InventoryBatch {
  id: number;
  product_id: number;
  product_name: string;
  part_number: string;
  bin_id: number;
  bin_code: string;
  zone_name: string;
  warehouse_name: string;
  quantity: number;
  lot_number: string | null;
  received_date: string;
  expiry_date: string | null;
  quality_status: QualityStatus;
}

export type POStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface POItem {
  id: number;
  product_id: number;
  product_name: string;
  part_number: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier_name: string;
  status: POStatus;
  expected_date: string | null;
  notes: string | null;
  created_by_id: number;
  items: POItem[];
}

export type SOStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface SOItem {
  id: number;
  product_id: number;
  product_name: string;
  part_number: string;
  quantity: number;
  unit_price: number;
}

export interface SalesOrder {
  id: number;
  customer_ref: string;
  customer_email: string | null;
  status: SOStatus;
  ship_by_date: string | null;
  created_by_id: number;
  items: SOItem[];
}

export type MovementType = 'RECEIVE' | 'SHIP' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  part_number: string;
  from_bin_code: string | null;
  to_bin_code: string | null;
  quantity: number;
  movement_type: MovementType;
  reference_po_id: number | null;
  reference_so_id: number | null;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

export interface AlertItem {
  product_id: number;
  name: string;
  part_number: string;
  total_stock: number;
  reorder_point: number;
  deficit: number;
}

export interface MovementSummary {
  movement_type: string;
  count: number;
}

export interface Dashboard {
  total_products: number;
  total_stock_units: number;
  open_purchase_orders: number;
  low_stock_count: number;
  quarantine_batches: number;
  pending_sales_orders: number;
  movement_summary: MovementSummary[];
}
