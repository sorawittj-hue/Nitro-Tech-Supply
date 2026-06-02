import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import type { BusinessCollection } from '../context/AppContext';
import type { Agent } from '../data/agents';

type OpsTab = 'crm' | 'sales' | 'procurement' | 'service' | 'tasks';

interface BusinessOpsProps {
  agents: Agent[];
}

const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

export function BusinessOps({ agents }: BusinessOpsProps) {
  const {
    customers,
    suppliers,
    quotes,
    invoices,
    payments,
    purchaseOrders,
    shipments,
    claims,
    companyAgentTasks,
    createBusinessRecord,
    updateBusinessRecord,
    addToast,
  } = useApp();
  const [activeTab, setActiveTab] = useState<OpsTab>('crm');
  const [submitting, setSubmitting] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', type: 'wholesale', phone: '', email: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', paymentTerms: 'COD', leadTimeDays: 7, rating: 4 });
  const [quoteForm, setQuoteForm] = useState({ customerId: '', totalValue: 0, grossMargin: 15, validUntil: '' });
  const [invoiceForm, setInvoiceForm] = useState({ customerId: '', amount: 0, dueDate: nextDate(7) });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: '', amount: 0, method: 'bank_transfer', reference: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', totalCost: 0, expectedAt: nextDate(14) });
  const [claimForm, setClaimForm] = useState({ customerId: '', item: '', priority: 'medium' });
  const [taskForm, setTaskForm] = useState({ agentId: agents.find(agent => agent.id !== 'ceo_jay')?.id ?? '', title: '', priority: 'medium' });

  const selectedCustomerId = quoteForm.customerId || customers[0]?.id || '';
  const selectedInvoiceCustomerId = invoiceForm.customerId || customers[0]?.id || '';
  const openPaymentInvoice = invoices.find(invoice => invoice.status !== 'Paid' && invoice.status !== 'Cancelled') ?? invoices[0];
  const selectedPaymentInvoiceId = paymentForm.invoiceId || openPaymentInvoice?.id || '';
  const selectedPaymentInvoice = invoices.find(invoice => invoice.id === selectedPaymentInvoiceId);
  const selectedSupplierId = purchaseForm.supplierId || suppliers[0]?.id || '';
  const selectedClaimCustomerId = claimForm.customerId || customers[0]?.id || '';

  const metrics = useMemo(() => {
    const openInvoices = invoices.filter(invoice => invoice.status !== 'Paid' && invoice.status !== 'Cancelled');
    const openInvoiceValue = openInvoices.reduce((sum, invoice) => sum + Math.max(invoice.amount - invoice.paidAmount, 0), 0);
    const openPoValue = purchaseOrders
      .filter(order => order.status !== 'Received' && order.status !== 'Cancelled')
      .reduce((sum, order) => sum + order.totalCost, 0);

    return {
      openInvoiceValue,
      openPoValue,
      activeClaims: claims.filter(claim => claim.status !== 'Resolved' && claim.status !== 'Rejected').length,
      activeTasks: companyAgentTasks.filter(task => task.status !== 'done').length,
    };
  }, [claims, companyAgentTasks, invoices, purchaseOrders]);

  const submit = async (collection: BusinessCollection, record: Record<string, unknown>, successMessage: string): Promise<boolean> => {
    try {
      setSubmitting(true);
      await createBusinessRecord(collection, record);
      addToast('success', successMessage);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast('error', message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const createCustomer = () => {
    if (!customerForm.name.trim()) {
      addToast('warning', 'Customer name is required');
      return;
    }
    void submit('customers', {
      id: makeId('cust'),
      name: customerForm.name.trim(),
      type: customerForm.type,
      status: 'lead',
      phone: customerForm.phone.trim() || undefined,
      email: customerForm.email.trim() || undefined,
      totalSpendTHB: 0,
      lastContactAt: new Date().toISOString(),
    }, 'Customer created').then(created => {
      if (created) setCustomerForm({ name: '', type: 'wholesale', phone: '', email: '' });
    });
  };

  const createSupplier = () => {
    if (!supplierForm.name.trim()) {
      addToast('warning', 'Supplier name is required');
      return;
    }
    void submit('suppliers', {
      id: makeId('sup'),
      name: supplierForm.name.trim(),
      status: 'active',
      leadTimeDays: Number(supplierForm.leadTimeDays),
      paymentTerms: supplierForm.paymentTerms.trim() || 'COD',
      rating: Number(supplierForm.rating),
    }, 'Supplier created').then(created => {
      if (created) setSupplierForm({ name: '', paymentTerms: 'COD', leadTimeDays: 7, rating: 4 });
    });
  };

  const createQuote = () => {
    if (!selectedCustomerId) {
      addToast('warning', 'Create a customer before creating a quote');
      return;
    }
    if (Number(quoteForm.totalValue) <= 0) {
      addToast('warning', 'Quote value must be greater than zero');
      return;
    }
    void submit('quotes', {
      id: makeId('quote'),
      customerId: selectedCustomerId,
      status: 'Draft',
      totalValue: Number(quoteForm.totalValue),
      grossMargin: Number(quoteForm.grossMargin),
      createdAt: new Date().toISOString(),
      validUntil: quoteForm.validUntil || undefined,
    }, 'Quote draft created');
  };

  const createInvoice = () => {
    if (!selectedInvoiceCustomerId) {
      addToast('warning', 'Create a customer before creating an invoice');
      return;
    }
    if (Number(invoiceForm.amount) <= 0) {
      addToast('warning', 'Invoice amount must be greater than zero');
      return;
    }
    void submit('invoices', {
      id: makeId('inv'),
      customerId: selectedInvoiceCustomerId,
      status: 'Issued',
      amount: Number(invoiceForm.amount),
      paidAmount: 0,
      dueDate: invoiceForm.dueDate,
      issuedAt: new Date().toISOString(),
    }, 'Invoice issued');
  };

  const createPayment = async () => {
    if (!selectedPaymentInvoice) {
      addToast('warning', 'Create an invoice before recording a payment');
      return;
    }

    const amount = Number(paymentForm.amount);
    if (amount <= 0) {
      addToast('warning', 'Payment amount must be greater than zero');
      return;
    }

    try {
      setSubmitting(true);
      await createBusinessRecord('payments', {
        id: makeId('pay'),
        invoiceId: selectedPaymentInvoice.id,
        method: paymentForm.method,
        amount,
        paidAt: new Date().toISOString(),
        reference: paymentForm.reference.trim() || undefined,
      });

      const nextPaidAmount = Math.min(selectedPaymentInvoice.amount, selectedPaymentInvoice.paidAmount + amount);
      await updateBusinessRecord('invoices', selectedPaymentInvoice.id, {
        paidAmount: nextPaidAmount,
        status: nextPaidAmount >= selectedPaymentInvoice.amount ? 'Paid' : 'Issued',
      });

      setPaymentForm({ invoiceId: selectedPaymentInvoice.id, amount: 0, method: 'bank_transfer', reference: '' });
      addToast('success', 'Payment recorded and invoice updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const createPurchaseOrder = () => {
    if (!selectedSupplierId) {
      addToast('warning', 'Create a supplier before creating a PO');
      return;
    }
    if (Number(purchaseForm.totalCost) <= 0) {
      addToast('warning', 'PO total cost must be greater than zero');
      return;
    }
    void submit('purchaseOrders', {
      id: makeId('po'),
      supplierId: selectedSupplierId,
      status: 'Draft',
      totalCost: Number(purchaseForm.totalCost),
      createdAt: new Date().toISOString(),
      expectedAt: purchaseForm.expectedAt || undefined,
    }, 'Purchase order draft created');
  };

  const createClaim = () => {
    if (!selectedClaimCustomerId || !claimForm.item.trim()) {
      addToast('warning', 'Customer and item are required for a claim');
      return;
    }
    void submit('claims', {
      id: makeId('claim'),
      customerId: selectedClaimCustomerId,
      item: claimForm.item.trim(),
      status: 'Open',
      priority: claimForm.priority,
      createdAt: new Date().toISOString(),
    }, 'Claim opened').then(created => {
      if (created) setClaimForm({ customerId: '', item: '', priority: 'medium' });
    });
  };

  const createTask = () => {
    const agentId = taskForm.agentId || agents.find(agent => agent.id !== 'ceo_jay')?.id;
    if (!agentId || !taskForm.title.trim()) {
      addToast('warning', 'Agent and task title are required');
      return;
    }
    void submit('agentTasks', {
      id: makeId('task'),
      agentId,
      title: taskForm.title.trim(),
      status: 'todo',
      priority: taskForm.priority,
      source: 'ceo',
      createdAt: new Date().toISOString(),
    }, 'Agent task created').then(created => {
      if (created) setTaskForm(prev => ({ ...prev, title: '' }));
    });
  };

  return (
    <div className="business-ops">
      <div className="business-ops-summary">
        <SummaryCard label="Customers" value={customers.length.toString()} detail={`${quotes.length} quotes`} />
        <SummaryCard label="Open AR" value={currencyFormatter.format(metrics.openInvoiceValue)} detail={`${invoices.length} invoices`} />
        <SummaryCard label="Open PO" value={currencyFormatter.format(metrics.openPoValue)} detail={`${purchaseOrders.length} purchase orders`} />
        <SummaryCard label="Ops Risk" value={(metrics.activeClaims + metrics.activeTasks).toString()} detail={`${metrics.activeClaims} claims / ${metrics.activeTasks} tasks`} />
      </div>

      <div className="business-ops-tabs">
        {(['crm', 'sales', 'procurement', 'service', 'tasks'] as const).map(tab => (
          <button key={tab} type="button" className={`business-ops-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {activeTab === 'crm' && (
        <section className="business-ops-grid">
          <OpsForm title="Create Customer">
            <input className="form-input" value={customerForm.name} onChange={event => setCustomerForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Customer / company name" />
            <select className="form-input" value={customerForm.type} onChange={event => setCustomerForm(prev => ({ ...prev, type: event.target.value }))}>
              <option value="wholesale">Wholesale</option>
              <option value="retail">Retail</option>
            </select>
            <input className="form-input" value={customerForm.phone} onChange={event => setCustomerForm(prev => ({ ...prev, phone: event.target.value }))} placeholder="Phone" />
            <input className="form-input" value={customerForm.email} onChange={event => setCustomerForm(prev => ({ ...prev, email: event.target.value }))} placeholder="Email" />
            <button type="button" className="btn btn-primary" onClick={createCustomer} disabled={submitting}>Create Customer</button>
          </OpsForm>
          <OpsList title="Customer Pipeline" items={customers.map(customer => `${customer.name} - ${customer.type.toUpperCase()} - ${customer.status}`)} empty="No customers yet." />
        </section>
      )}

      {activeTab === 'sales' && (
        <section className="business-ops-grid">
          <OpsForm title="Create Quote / Invoice">
            <select className="form-input" value={selectedCustomerId} onChange={event => setQuoteForm(prev => ({ ...prev, customerId: event.target.value }))}>
              <option value="">Select customer</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="form-input" type="number" min="0" value={quoteForm.totalValue} onChange={event => setQuoteForm(prev => ({ ...prev, totalValue: Number(event.target.value) }))} placeholder="Quote value THB" />
            <input className="form-input" type="number" min="0" value={quoteForm.grossMargin} onChange={event => setQuoteForm(prev => ({ ...prev, grossMargin: Number(event.target.value) }))} placeholder="Gross margin %" />
            <input className="form-input" type="date" value={quoteForm.validUntil} onChange={event => setQuoteForm(prev => ({ ...prev, validUntil: event.target.value }))} />
            <button type="button" className="btn btn-primary" onClick={createQuote} disabled={submitting}>Create Quote Draft</button>
            <div className="business-ops-divider" />
            <select className="form-input" value={selectedInvoiceCustomerId} onChange={event => setInvoiceForm(prev => ({ ...prev, customerId: event.target.value }))}>
              <option value="">Select customer</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="form-input" type="number" min="0" value={invoiceForm.amount} onChange={event => setInvoiceForm(prev => ({ ...prev, amount: Number(event.target.value) }))} placeholder="Invoice amount THB" />
            <input className="form-input" type="date" value={invoiceForm.dueDate} onChange={event => setInvoiceForm(prev => ({ ...prev, dueDate: event.target.value }))} />
            <button type="button" className="btn btn-ghost" onClick={createInvoice} disabled={submitting}>Issue Invoice</button>
            <div className="business-ops-divider" />
            <select className="form-input" value={selectedPaymentInvoiceId} onChange={event => setPaymentForm(prev => ({ ...prev, invoiceId: event.target.value }))}>
              <option value="">Select invoice</option>
              {invoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.id} - {currencyFormatter.format(Math.max(invoice.amount - invoice.paidAmount, 0))} due
                </option>
              ))}
            </select>
            <input className="form-input" type="number" min="0" value={paymentForm.amount} onChange={event => setPaymentForm(prev => ({ ...prev, amount: Number(event.target.value) }))} placeholder="Payment amount THB" />
            <select className="form-input" value={paymentForm.method} onChange={event => setPaymentForm(prev => ({ ...prev, method: event.target.value }))}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            <input className="form-input" value={paymentForm.reference} onChange={event => setPaymentForm(prev => ({ ...prev, reference: event.target.value }))} placeholder="Payment reference" />
            <button type="button" className="btn btn-ghost" onClick={() => void createPayment()} disabled={submitting}>Record Payment</button>
          </OpsForm>
          <OpsList title="Sales Documents" items={[
            ...quotes.map(quote => `${quote.id} - ${quote.status} - ${currencyFormatter.format(quote.totalValue)} - ${quote.grossMargin}% GM`),
            ...invoices.map(invoice => `${invoice.id} - ${invoice.status} - ${currencyFormatter.format(Math.max(invoice.amount - invoice.paidAmount, 0))} due`),
            ...payments.map(payment => `${payment.id} - ${payment.method} - ${currencyFormatter.format(payment.amount)}`),
          ]} empty="No quotes, invoices, or payments yet." />
        </section>
      )}

      {activeTab === 'procurement' && (
        <section className="business-ops-grid">
          <OpsForm title="Supplier + Purchase Order">
            <input className="form-input" value={supplierForm.name} onChange={event => setSupplierForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Supplier name" />
            <input className="form-input" value={supplierForm.paymentTerms} onChange={event => setSupplierForm(prev => ({ ...prev, paymentTerms: event.target.value }))} placeholder="Payment terms" />
            <input className="form-input" type="number" min="0" value={supplierForm.leadTimeDays} onChange={event => setSupplierForm(prev => ({ ...prev, leadTimeDays: Number(event.target.value) }))} placeholder="Lead time days" />
            <input className="form-input" type="number" min="0" max="5" value={supplierForm.rating} onChange={event => setSupplierForm(prev => ({ ...prev, rating: Number(event.target.value) }))} placeholder="Rating 0-5" />
            <button type="button" className="btn btn-primary" onClick={createSupplier} disabled={submitting}>Create Supplier</button>
            <div className="business-ops-divider" />
            <select className="form-input" value={selectedSupplierId} onChange={event => setPurchaseForm(prev => ({ ...prev, supplierId: event.target.value }))}>
              <option value="">Select supplier</option>
              {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <input className="form-input" type="number" min="0" value={purchaseForm.totalCost} onChange={event => setPurchaseForm(prev => ({ ...prev, totalCost: Number(event.target.value) }))} placeholder="PO total cost THB" />
            <input className="form-input" type="date" value={purchaseForm.expectedAt} onChange={event => setPurchaseForm(prev => ({ ...prev, expectedAt: event.target.value }))} />
            <button type="button" className="btn btn-ghost" onClick={createPurchaseOrder} disabled={submitting}>Create PO Draft</button>
          </OpsForm>
          <OpsList title="Supply Pipeline" items={[
            ...suppliers.map(supplier => `${supplier.name} - ${supplier.paymentTerms} - ${supplier.leadTimeDays}d lead`),
            ...purchaseOrders.map(order => `${order.id} - ${order.status} - ${currencyFormatter.format(order.totalCost)}`),
          ]} empty="No suppliers or purchase orders yet." />
        </section>
      )}

      {activeTab === 'service' && (
        <section className="business-ops-grid">
          <OpsForm title="Open Claim">
            <select className="form-input" value={selectedClaimCustomerId} onChange={event => setClaimForm(prev => ({ ...prev, customerId: event.target.value }))}>
              <option value="">Select customer</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="form-input" value={claimForm.item} onChange={event => setClaimForm(prev => ({ ...prev, item: event.target.value }))} placeholder="Item / serial / issue" />
            <select className="form-input" value={claimForm.priority} onChange={event => setClaimForm(prev => ({ ...prev, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={createClaim} disabled={submitting}>Open Claim</button>
          </OpsForm>
          <OpsList title="Service Desk" items={[
            ...claims.map(claim => `${claim.id} - ${claim.priority.toUpperCase()} - ${claim.status} - ${claim.item}`),
            ...shipments.map(shipment => `${shipment.id} - ${shipment.carrier} - ${shipment.status}`),
          ]} empty="No claims or shipments yet." />
        </section>
      )}

      {activeTab === 'tasks' && (
        <section className="business-ops-grid">
          <OpsForm title="Assign Agent Task">
            <select className="form-input" value={taskForm.agentId} onChange={event => setTaskForm(prev => ({ ...prev, agentId: event.target.value }))}>
              {agents.filter(agent => agent.id !== 'ceo_jay').map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
            <input className="form-input" value={taskForm.title} onChange={event => setTaskForm(prev => ({ ...prev, title: event.target.value }))} placeholder="Task title" />
            <select className="form-input" value={taskForm.priority} onChange={event => setTaskForm(prev => ({ ...prev, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={createTask} disabled={submitting}>Create Agent Task</button>
          </OpsForm>
          <OpsList title="Company Agent Tasks" items={companyAgentTasks.map(task => `${task.id} - ${task.agentId} - ${task.priority.toUpperCase()} - ${task.status} - ${task.title}`)} empty="No company tasks yet." />
        </section>
      )}
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="business-summary-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value cyan">{value}</div>
      <div className="kpi-sub">{detail}</div>
    </div>
  );
}

function OpsForm({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="business-ops-card">
      <div className="panel-card-header">
        <span className="panel-card-title">{title}</span>
      </div>
      <div className="business-ops-form">{children}</div>
    </div>
  );
}

function OpsList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="business-ops-card">
      <div className="panel-card-header">
        <span className="panel-card-title">{title}</span>
        <span className="badge badge-info">{items.length}</span>
      </div>
      <div className="business-ops-list">
        {items.length === 0 ? (
          <span className="muted-line">{empty}</span>
        ) : items.slice(0, 12).map(item => (
          <div key={item} className="compact-row">
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nextDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function tabLabel(tab: OpsTab): string {
  if (tab === 'crm') return 'CRM';
  if (tab === 'sales') return 'Sales';
  if (tab === 'procurement') return 'Procurement';
  if (tab === 'service') return 'Service';
  return 'Agent Tasks';
}
