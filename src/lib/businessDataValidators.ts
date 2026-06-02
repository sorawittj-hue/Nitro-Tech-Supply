import type {
  AffiliateData,
  ClaimRecord,
  CompanyAgentTask,
  CustomerRecord,
  FinanceData,
  InventoryItem,
  InvoiceRecord,
  NitroHealthStatus,
  OrderItem,
  PaymentRecord,
  PurchaseOrderRecord,
  QuoteRecord,
  ShipmentRecord,
  SupplierRecord,
} from '../context/AppContext';

export function parseInventoryData(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) throw new Error('Inventory payload must be an array.');
  return value.map((item, index) => {
    if (!isRecord(item)) throw new Error(`Inventory item ${index} must be an object.`);
    return {
      id: readString(item, 'id', `inventory[${index}].id`),
      name: readString(item, 'name', `inventory[${index}].name`),
      stock: readNumber(item, 'stock', `inventory[${index}].stock`),
      threshold: readNumber(item, 'threshold', `inventory[${index}].threshold`),
      price: readNumber(item, 'price', `inventory[${index}].price`),
    };
  });
}

export function parseOrderData(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) throw new Error('Orders payload must be an array.');
  return value.map((order, index) => {
    if (!isRecord(order)) throw new Error(`Order ${index} must be an object.`);
    return {
      id: readString(order, 'id', `orders[${index}].id`),
      customer: readString(order, 'customer', `orders[${index}].customer`),
      item: readString(order, 'item', `orders[${index}].item`),
      quantity: readNumber(order, 'quantity', `orders[${index}].quantity`),
      status: readString(order, 'status', `orders[${index}].status`),
      value: readNumber(order, 'value', `orders[${index}].value`),
      date: readString(order, 'date', `orders[${index}].date`),
    };
  });
}

export function parseAffiliateData(value: unknown): AffiliateData {
  if (!isRecord(value)) throw new Error('Affiliate payload must be an object.');
  return {
    totalClicks: readNumber(value, 'totalClicks', 'affiliate.totalClicks'),
    conversions: readNumber(value, 'conversions', 'affiliate.conversions'),
    revenueTHB: readNumber(value, 'revenueTHB', 'affiliate.revenueTHB'),
  };
}

export function parseFinanceData(value: unknown): FinanceData {
  if (!isRecord(value)) throw new Error('Finance payload must be an object.');
  return {
    cashOnHand: readNumber(value, 'cashOnHand', 'finance.cashOnHand'),
    accountsPayable: readOptionalNumber(value, 'accountsPayable', 'finance.accountsPayable'),
    weeklyReserveTarget: readOptionalNumber(value, 'weeklyReserveTarget', 'finance.weeklyReserveTarget'),
    monthlyOperatingExpense: readOptionalNumber(value, 'monthlyOperatingExpense', 'finance.monthlyOperatingExpense'),
    creditLineAvailable: readOptionalNumber(value, 'creditLineAvailable', 'finance.creditLineAvailable'),
  };
}

export function parseCustomerData(value: unknown): CustomerRecord[] {
  if (!Array.isArray(value)) throw new Error('Customers payload must be an array.');
  return value.map((customer, index) => {
    if (!isRecord(customer)) throw new Error(`Customer ${index} must be an object.`);
    return {
      id: readString(customer, 'id', `customers[${index}].id`),
      name: readString(customer, 'name', `customers[${index}].name`),
      type: readEnum(customer, 'type', ['retail', 'wholesale'], `customers[${index}].type`),
      status: readEnum(customer, 'status', ['lead', 'active', 'inactive'], `customers[${index}].status`),
      phone: readOptionalString(customer, 'phone', `customers[${index}].phone`),
      email: readOptionalString(customer, 'email', `customers[${index}].email`),
      taxId: readOptionalString(customer, 'taxId', `customers[${index}].taxId`),
      address: readOptionalString(customer, 'address', `customers[${index}].address`),
      totalSpendTHB: readNumber(customer, 'totalSpendTHB', `customers[${index}].totalSpendTHB`),
      lastContactAt: readOptionalString(customer, 'lastContactAt', `customers[${index}].lastContactAt`),
    };
  });
}

export function parseSupplierData(value: unknown): SupplierRecord[] {
  if (!Array.isArray(value)) throw new Error('Suppliers payload must be an array.');
  return value.map((supplier, index) => {
    if (!isRecord(supplier)) throw new Error(`Supplier ${index} must be an object.`);
    return {
      id: readString(supplier, 'id', `suppliers[${index}].id`),
      name: readString(supplier, 'name', `suppliers[${index}].name`),
      status: readEnum(supplier, 'status', ['active', 'watchlist', 'inactive'], `suppliers[${index}].status`),
      contactName: readOptionalString(supplier, 'contactName', `suppliers[${index}].contactName`),
      phone: readOptionalString(supplier, 'phone', `suppliers[${index}].phone`),
      email: readOptionalString(supplier, 'email', `suppliers[${index}].email`),
      leadTimeDays: readNumber(supplier, 'leadTimeDays', `suppliers[${index}].leadTimeDays`),
      paymentTerms: readString(supplier, 'paymentTerms', `suppliers[${index}].paymentTerms`),
      rating: readNumber(supplier, 'rating', `suppliers[${index}].rating`),
    };
  });
}

export function parseQuoteData(value: unknown): QuoteRecord[] {
  if (!Array.isArray(value)) throw new Error('Quotes payload must be an array.');
  return value.map((quote, index) => {
    if (!isRecord(quote)) throw new Error(`Quote ${index} must be an object.`);
    return {
      id: readString(quote, 'id', `quotes[${index}].id`),
      customerId: readString(quote, 'customerId', `quotes[${index}].customerId`),
      status: readEnum(quote, 'status', ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], `quotes[${index}].status`),
      totalValue: readNumber(quote, 'totalValue', `quotes[${index}].totalValue`),
      grossMargin: readNumber(quote, 'grossMargin', `quotes[${index}].grossMargin`),
      createdAt: readString(quote, 'createdAt', `quotes[${index}].createdAt`),
      validUntil: readOptionalString(quote, 'validUntil', `quotes[${index}].validUntil`),
    };
  });
}

export function parseInvoiceData(value: unknown): InvoiceRecord[] {
  if (!Array.isArray(value)) throw new Error('Invoices payload must be an array.');
  return value.map((invoice, index) => {
    if (!isRecord(invoice)) throw new Error(`Invoice ${index} must be an object.`);
    return {
      id: readString(invoice, 'id', `invoices[${index}].id`),
      customerId: readString(invoice, 'customerId', `invoices[${index}].customerId`),
      orderId: readOptionalString(invoice, 'orderId', `invoices[${index}].orderId`),
      status: readEnum(invoice, 'status', ['Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'], `invoices[${index}].status`),
      amount: readNumber(invoice, 'amount', `invoices[${index}].amount`),
      paidAmount: readNumber(invoice, 'paidAmount', `invoices[${index}].paidAmount`),
      dueDate: readString(invoice, 'dueDate', `invoices[${index}].dueDate`),
      issuedAt: readOptionalString(invoice, 'issuedAt', `invoices[${index}].issuedAt`),
    };
  });
}

export function parsePaymentData(value: unknown): PaymentRecord[] {
  if (!Array.isArray(value)) throw new Error('Payments payload must be an array.');
  return value.map((payment, index) => {
    if (!isRecord(payment)) throw new Error(`Payment ${index} must be an object.`);
    return {
      id: readString(payment, 'id', `payments[${index}].id`),
      invoiceId: readString(payment, 'invoiceId', `payments[${index}].invoiceId`),
      method: readEnum(payment, 'method', ['cash', 'bank_transfer', 'card', 'other'], `payments[${index}].method`),
      amount: readNumber(payment, 'amount', `payments[${index}].amount`),
      paidAt: readString(payment, 'paidAt', `payments[${index}].paidAt`),
      reference: readOptionalString(payment, 'reference', `payments[${index}].reference`),
    };
  });
}

export function parsePurchaseOrderData(value: unknown): PurchaseOrderRecord[] {
  if (!Array.isArray(value)) throw new Error('Purchase orders payload must be an array.');
  return value.map((purchaseOrder, index) => {
    if (!isRecord(purchaseOrder)) throw new Error(`Purchase order ${index} must be an object.`);
    return {
      id: readString(purchaseOrder, 'id', `purchaseOrders[${index}].id`),
      supplierId: readString(purchaseOrder, 'supplierId', `purchaseOrders[${index}].supplierId`),
      status: readEnum(purchaseOrder, 'status', ['Draft', 'Approved', 'Ordered', 'Received', 'Cancelled'], `purchaseOrders[${index}].status`),
      totalCost: readNumber(purchaseOrder, 'totalCost', `purchaseOrders[${index}].totalCost`),
      createdAt: readString(purchaseOrder, 'createdAt', `purchaseOrders[${index}].createdAt`),
      expectedAt: readOptionalString(purchaseOrder, 'expectedAt', `purchaseOrders[${index}].expectedAt`),
    };
  });
}

export function parseShipmentData(value: unknown): ShipmentRecord[] {
  if (!Array.isArray(value)) throw new Error('Shipments payload must be an array.');
  return value.map((shipment, index) => {
    if (!isRecord(shipment)) throw new Error(`Shipment ${index} must be an object.`);
    return {
      id: readString(shipment, 'id', `shipments[${index}].id`),
      orderId: readString(shipment, 'orderId', `shipments[${index}].orderId`),
      carrier: readString(shipment, 'carrier', `shipments[${index}].carrier`),
      trackingNumber: readOptionalString(shipment, 'trackingNumber', `shipments[${index}].trackingNumber`),
      status: readEnum(shipment, 'status', ['Pending', 'Packed', 'Shipped', 'Delivered', 'Delayed'], `shipments[${index}].status`),
      eta: readOptionalString(shipment, 'eta', `shipments[${index}].eta`),
    };
  });
}

export function parseClaimData(value: unknown): ClaimRecord[] {
  if (!Array.isArray(value)) throw new Error('Claims payload must be an array.');
  return value.map((claim, index) => {
    if (!isRecord(claim)) throw new Error(`Claim ${index} must be an object.`);
    return {
      id: readString(claim, 'id', `claims[${index}].id`),
      customerId: readString(claim, 'customerId', `claims[${index}].customerId`),
      orderId: readOptionalString(claim, 'orderId', `claims[${index}].orderId`),
      item: readString(claim, 'item', `claims[${index}].item`),
      status: readEnum(claim, 'status', ['Open', 'Testing', 'Approved', 'Rejected', 'Resolved'], `claims[${index}].status`),
      priority: readEnum(claim, 'priority', ['low', 'medium', 'high'], `claims[${index}].priority`),
      createdAt: readString(claim, 'createdAt', `claims[${index}].createdAt`),
    };
  });
}

export function parseCompanyAgentTaskData(value: unknown): CompanyAgentTask[] {
  if (!Array.isArray(value)) throw new Error('Agent tasks payload must be an array.');
  return value.map((task, index) => {
    if (!isRecord(task)) throw new Error(`Agent task ${index} must be an object.`);
    return {
      id: readString(task, 'id', `agentTasks[${index}].id`),
      agentId: readString(task, 'agentId', `agentTasks[${index}].agentId`),
      title: readString(task, 'title', `agentTasks[${index}].title`),
      status: readEnum(task, 'status', ['todo', 'in_progress', 'done', 'blocked'], `agentTasks[${index}].status`),
      priority: readEnum(task, 'priority', ['low', 'medium', 'high'], `agentTasks[${index}].priority`),
      source: readEnum(task, 'source', ['ceo', 'hermes', 'system'], `agentTasks[${index}].source`),
      createdAt: readString(task, 'createdAt', `agentTasks[${index}].createdAt`),
      dueAt: readOptionalString(task, 'dueAt', `agentTasks[${index}].dueAt`),
    };
  });
}

export function parseNitroHealthStatus(value: unknown): NitroHealthStatus {
  if (!isRecord(value)) throw new Error('Nitro health payload must be an object.');
  return {
    status: readString(value, 'status', 'health.status'),
    service: readString(value, 'service', 'health.service'),
    dataWriteAuthConfigured: readBoolean(value, 'dataWriteAuthConfigured', 'health.dataWriteAuthConfigured'),
    dataWriteAuthRequired: readBoolean(value, 'dataWriteAuthRequired', 'health.dataWriteAuthRequired'),
    dataWriteAuthExplicitlyRequired: readOptionalBoolean(value, 'dataWriteAuthExplicitlyRequired', 'health.dataWriteAuthExplicitlyRequired'),
    auditLogEnabled: readOptionalBoolean(value, 'auditLogEnabled', 'health.auditLogEnabled'),
    checkedAt: new Date().toISOString(),
  };
}

function readString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string') throw new Error(`${label} must be a string.`);
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean.`);
  return value;
}

function readOptionalBoolean(record: Record<string, unknown>, key: string, label: string): boolean | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean when provided.`);
  return value;
}

function readOptionalString(record: Record<string, unknown>, key: string, label: string): string | undefined {
  const value = record[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${label} must be a string when provided.`);
  return value;
}

function readNumber(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  return value;
}

function readOptionalNumber(record: Record<string, unknown>, key: string, label: string): number | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number when provided.`);
  return value;
}

function readEnum<const T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  label: string
): T {
  const value = record[key];
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return value as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
