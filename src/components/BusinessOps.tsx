import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import type { BusinessCollection, InvoiceRecord, PurchaseOrderRecord, QuoteRecord } from '../context/AppContext';
import type { Agent } from '../data/agents';
import { openInvoiceDocument, openPurchaseOrderDocument, openQuoteDocument } from '../lib/businessDocuments';
import { isCeoAgent } from '../lib/agentIdentity';
import { transport } from '../transport';

type OpsTab = 'crm' | 'sales' | 'procurement' | 'service' | 'tasks';

interface BusinessOpsProps {
  agents: Agent[];
}

const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

const CEO_APPROVAL_THRESHOLD_THB = 50_000;

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
    dataWriteToken,
    nitroHealth,
    createBusinessRecord,
    updateBusinessRecord,
    addToast,
  } = useApp();
  const [activeTab, setActiveTab] = useState<OpsTab>('crm');
  const [submitting, setSubmitting] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', type: 'wholesale', phone: '', email: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '', paymentTerms: 'COD', leadTimeDays: 7, rating: 4 });
  const [quoteForm, setQuoteForm] = useState({ customerId: '', description: '', totalValue: 0, grossMargin: 15, validUntil: '' });
  const [invoiceForm, setInvoiceForm] = useState({ customerId: '', description: '', amount: 0, dueDate: nextDate(7) });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: '', amount: 0, method: 'bank_transfer', reference: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', description: '', totalCost: 0, expectedAt: nextDate(14) });
  const [claimForm, setClaimForm] = useState({ customerId: '', item: '', priority: 'medium' });
  const [taskForm, setTaskForm] = useState({ agentId: firstAssignableAgentId(agents), title: '', priority: 'medium' });

  const selectedCustomerId = quoteForm.customerId || customers[0]?.id || '';
  const selectedInvoiceCustomerId = invoiceForm.customerId || customers[0]?.id || '';
  const openPaymentInvoice = invoices.find(invoice => invoice.status !== 'Paid' && invoice.status !== 'Cancelled') ?? invoices[0];
  const selectedPaymentInvoiceId = paymentForm.invoiceId || openPaymentInvoice?.id || '';
  const selectedPaymentInvoice = invoices.find(invoice => invoice.id === selectedPaymentInvoiceId);
  const selectedSupplierId = purchaseForm.supplierId || suppliers[0]?.id || '';
  const selectedClaimCustomerId = claimForm.customerId || customers[0]?.id || '';
  const writesLocked = Boolean(nitroHealth?.dataWriteAuthRequired && !dataWriteToken);
  const assignableAgents = useMemo(() => agents.filter(agent => !isCeoAgent(agent)), [agents]);
  const ceoAgentId = useMemo(() => agents.find(isCeoAgent)?.id ?? 'ceo-jay-command', [agents]);

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
      description: quoteForm.description.trim() || 'IT hardware supply package',
      totalValue: Number(quoteForm.totalValue),
      grossMargin: Number(quoteForm.grossMargin),
      createdAt: new Date().toISOString(),
      validUntil: quoteForm.validUntil || undefined,
    }, 'Quote draft created').then(created => {
      if (created) setQuoteForm(prev => ({ ...prev, description: '', totalValue: 0, validUntil: '' }));
    });
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
      description: invoiceForm.description.trim() || 'IT hardware supply package',
      amount: Number(invoiceForm.amount),
      paidAmount: 0,
      dueDate: invoiceForm.dueDate,
      issuedAt: new Date().toISOString(),
    }, 'Invoice issued').then(created => {
      if (created) setInvoiceForm(prev => ({ ...prev, description: '', amount: 0, dueDate: nextDate(7) }));
    });
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

  const createPurchaseOrder = async () => {
    if (!selectedSupplierId) {
      addToast('warning', 'Create a supplier before creating a PO');
      return;
    }
    if (Number(purchaseForm.totalCost) <= 0) {
      addToast('warning', 'PO total cost must be greater than zero');
      return;
    }

    const totalCost = Number(purchaseForm.totalCost);
    const requiresApproval = totalCost > CEO_APPROVAL_THRESHOLD_THB;
    const purchaseOrderId = makeId('po');

    try {
      setSubmitting(true);
      await createBusinessRecord('purchaseOrders', {
        id: purchaseOrderId,
        supplierId: selectedSupplierId,
        status: 'Draft',
        description: purchaseForm.description.trim() || 'IT hardware procurement order',
        totalCost,
        createdAt: new Date().toISOString(),
        expectedAt: purchaseForm.expectedAt || undefined,
        approvalStatus: requiresApproval ? 'pending' : 'not_required',
        approvalReason: requiresApproval
          ? `Purchase exceeds ${currencyFormatter.format(CEO_APPROVAL_THRESHOLD_THB)} CEO approval threshold.`
          : undefined,
      });

      if (requiresApproval) {
        const approvalTaskId = makeId('task');
        const approvalTitle = `Approve purchase order ${purchaseOrderId} (${currencyFormatter.format(totalCost)})`;
        await createBusinessRecord('agentTasks', {
          id: approvalTaskId,
          agentId: ceoAgentId,
          title: approvalTitle,
          status: 'todo',
          priority: 'high',
          source: 'system',
          createdAt: new Date().toISOString(),
        });
        transport.send({
          type: 'agent.task.assign',
          agentId: ceoAgentId,
          taskId: approvalTaskId,
          title: approvalTitle,
          detail: `Purchase order ${purchaseOrderId} exceeds CEO approval threshold ${currencyFormatter.format(CEO_APPROVAL_THRESHOLD_THB)}.`,
          priority: 'high',
          source: 'system',
          timestamp: Date.now(),
        });
        addToast('warning', 'PO created and routed to CEO approval');
      } else {
        addToast('success', 'Purchase order draft created');
      }
      setPurchaseForm(prev => ({ ...prev, description: '', totalCost: 0, expectedAt: nextDate(14) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast('error', message);
    } finally {
      setSubmitting(false);
    }
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
    const agentId = taskForm.agentId || assignableAgents[0]?.id;
    if (!agentId || !taskForm.title.trim()) {
      addToast('warning', 'Agent and task title are required');
      return;
    }
    const taskId = makeId('task');
    const title = taskForm.title.trim();
    const priority = taskForm.priority as 'low' | 'medium' | 'high';
    void submit('agentTasks', {
      id: taskId,
      agentId,
      title,
      status: 'todo',
      priority,
      source: 'ceo',
      createdAt: new Date().toISOString(),
    }, 'Agent task created').then(created => {
      if (created) {
        transport.send({
          type: 'agent.task.assign',
          agentId,
          taskId,
          title,
          detail: `Priority: ${priority}. Created from Business Ops.`,
          priority,
          source: 'ceo',
          timestamp: Date.now(),
        });
        setTaskForm(prev => ({ ...prev, title: '' }));
      }
    });
  };

  const openQuote = (quote: QuoteRecord) => {
    const result = openQuoteDocument(quote, customers.find(customer => customer.id === quote.customerId));
    addToast(result.ok ? 'info' : 'error', result.message);
  };

  const openInvoice = (invoice: InvoiceRecord) => {
    const result = openInvoiceDocument(invoice, customers.find(customer => customer.id === invoice.customerId));
    addToast(result.ok ? 'info' : 'error', result.message);
  };

  const openPurchaseOrder = (purchaseOrder: PurchaseOrderRecord) => {
    const result = openPurchaseOrderDocument(purchaseOrder, suppliers.find(supplier => supplier.id === purchaseOrder.supplierId));
    addToast(result.ok ? 'info' : 'error', result.message);
  };

  const approvePurchaseOrder = async (purchaseOrder: PurchaseOrderRecord) => {
    if (writesLocked) {
      addToast('warning', 'Add the DATA WRITE TOKEN in Settings before approving a purchase order');
      return;
    }

    try {
      setSubmitting(true);
      await updateBusinessRecord('purchaseOrders', purchaseOrder.id, {
        status: 'Approved',
        approvalStatus: 'approved',
        approvedBy: 'CEO Jay',
        approvedAt: new Date().toISOString(),
      });
      addToast('success', `Approved ${purchaseOrder.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="business-ops">
      <div className="business-ops-summary">
        <SummaryCard label="Customers" value={customers.length.toString()} detail={`${quotes.length} quotes`} />
        <SummaryCard label="Open AR" value={currencyFormatter.format(metrics.openInvoiceValue)} detail={`${invoices.length} invoices`} />
        <SummaryCard label="Open PO" value={currencyFormatter.format(metrics.openPoValue)} detail={`${purchaseOrders.length} purchase orders`} />
        <SummaryCard label="Ops Risk" value={(metrics.activeClaims + metrics.activeTasks).toString()} detail={`${metrics.activeClaims} claims / ${metrics.activeTasks} tasks`} />
      </div>

      {writesLocked && (
        <div className="form-error">
          Nitro data writes are protected. Add the DATA WRITE TOKEN in Settings before creating or updating business records.
        </div>
      )}

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
            <button type="button" className="btn btn-primary" onClick={createCustomer} disabled={submitting || writesLocked}>Create Customer</button>
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
            <input className="form-input" value={quoteForm.description} onChange={event => setQuoteForm(prev => ({ ...prev, description: event.target.value }))} placeholder="Quote item / bundle description" />
            <input className="form-input" type="number" min="0" value={quoteForm.totalValue} onChange={event => setQuoteForm(prev => ({ ...prev, totalValue: Number(event.target.value) }))} placeholder="Quote value THB" />
            <input className="form-input" type="number" min="0" value={quoteForm.grossMargin} onChange={event => setQuoteForm(prev => ({ ...prev, grossMargin: Number(event.target.value) }))} placeholder="Gross margin %" />
            <input className="form-input" type="date" value={quoteForm.validUntil} onChange={event => setQuoteForm(prev => ({ ...prev, validUntil: event.target.value }))} />
            <button type="button" className="btn btn-primary" onClick={createQuote} disabled={submitting || writesLocked}>Create Quote Draft</button>
            <div className="business-ops-divider" />
            <select className="form-input" value={selectedInvoiceCustomerId} onChange={event => setInvoiceForm(prev => ({ ...prev, customerId: event.target.value }))}>
              <option value="">Select customer</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            <input className="form-input" value={invoiceForm.description} onChange={event => setInvoiceForm(prev => ({ ...prev, description: event.target.value }))} placeholder="Invoice item / order description" />
            <input className="form-input" type="number" min="0" value={invoiceForm.amount} onChange={event => setInvoiceForm(prev => ({ ...prev, amount: Number(event.target.value) }))} placeholder="Invoice amount THB" />
            <input className="form-input" type="date" value={invoiceForm.dueDate} onChange={event => setInvoiceForm(prev => ({ ...prev, dueDate: event.target.value }))} />
            <button type="button" className="btn btn-ghost" onClick={createInvoice} disabled={submitting || writesLocked}>Issue Invoice</button>
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
            <button type="button" className="btn btn-ghost" onClick={() => void createPayment()} disabled={submitting || writesLocked}>Record Payment</button>
          </OpsForm>
          <OpsRecordList title="Sales Documents" items={[
            ...quotes.map(quote => ({
              id: quote.id,
              summary: `${quote.id} - ${quote.status} - ${currencyFormatter.format(quote.totalValue)} - ${quote.grossMargin}% GM`,
              meta: quote.description || 'Quote document',
              actions: <button type="button" className="btn btn-ghost" onClick={() => openQuote(quote)}>Print</button>,
            })),
            ...invoices.map(invoice => ({
              id: invoice.id,
              summary: `${invoice.id} - ${invoice.status} - ${currencyFormatter.format(Math.max(invoice.amount - invoice.paidAmount, 0))} due`,
              meta: invoice.description || 'Invoice document',
              actions: <button type="button" className="btn btn-ghost" onClick={() => openInvoice(invoice)}>Print</button>,
            })),
            ...payments.map(payment => ({
              id: payment.id,
              summary: `${payment.id} - ${payment.method} - ${currencyFormatter.format(payment.amount)}`,
              meta: `Invoice ${payment.invoiceId}`,
            })),
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
            <button type="button" className="btn btn-primary" onClick={createSupplier} disabled={submitting || writesLocked}>Create Supplier</button>
            <div className="business-ops-divider" />
            <select className="form-input" value={selectedSupplierId} onChange={event => setPurchaseForm(prev => ({ ...prev, supplierId: event.target.value }))}>
              <option value="">Select supplier</option>
              {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <input className="form-input" value={purchaseForm.description} onChange={event => setPurchaseForm(prev => ({ ...prev, description: event.target.value }))} placeholder="PO item / supplier order description" />
            <input className="form-input" type="number" min="0" value={purchaseForm.totalCost} onChange={event => setPurchaseForm(prev => ({ ...prev, totalCost: Number(event.target.value) }))} placeholder="PO total cost THB" />
            <input className="form-input" type="date" value={purchaseForm.expectedAt} onChange={event => setPurchaseForm(prev => ({ ...prev, expectedAt: event.target.value }))} />
            {Number(purchaseForm.totalCost) > CEO_APPROVAL_THRESHOLD_THB && (
              <div className="form-error">
                This PO exceeds {currencyFormatter.format(CEO_APPROVAL_THRESHOLD_THB)} and will require CEO approval.
              </div>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => void createPurchaseOrder()} disabled={submitting || writesLocked}>Create PO Draft</button>
          </OpsForm>
          <OpsRecordList title="Supply Pipeline" items={[
            ...suppliers.map(supplier => ({
              id: supplier.id,
              summary: `${supplier.name} - ${supplier.paymentTerms} - ${supplier.leadTimeDays}d lead`,
              meta: `Rating ${supplier.rating}/5`,
            })),
            ...purchaseOrders.map(order => ({
              id: order.id,
              summary: `${order.id} - ${order.status} - ${currencyFormatter.format(order.totalCost)}`,
              meta: `${order.description || 'Purchase order'} - Approval: ${order.approvalStatus || 'not_required'}`,
              actions: (
                <>
                  <button type="button" className="btn btn-ghost" onClick={() => openPurchaseOrder(order)}>Print</button>
                  {order.approvalStatus === 'pending' && (
                    <button type="button" className="btn btn-primary" onClick={() => void approvePurchaseOrder(order)} disabled={submitting || writesLocked}>
                      Approve
                    </button>
                  )}
                </>
              ),
            })),
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
            <button type="button" className="btn btn-primary" onClick={createClaim} disabled={submitting || writesLocked}>Open Claim</button>
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
              {assignableAgents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
            <input className="form-input" value={taskForm.title} onChange={event => setTaskForm(prev => ({ ...prev, title: event.target.value }))} placeholder="Task title" />
            <select className="form-input" value={taskForm.priority} onChange={event => setTaskForm(prev => ({ ...prev, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button type="button" className="btn btn-primary" onClick={createTask} disabled={submitting || writesLocked}>Create Agent Task</button>
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

interface OpsRecordListItem {
  id: string;
  summary: string;
  meta?: string;
  actions?: ReactNode;
}

function OpsRecordList({ title, items, empty }: { title: string; items: OpsRecordListItem[]; empty: string }) {
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
          <div key={item.id} className="business-record-row">
            <div className="business-record-main">
              <span>{item.summary}</span>
              {item.meta && <small>{item.meta}</small>}
            </div>
            {item.actions && <div className="business-record-actions">{item.actions}</div>}
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

function firstAssignableAgentId(agents: Agent[]): string {
  return agents.find(agent => !isCeoAgent(agent))?.id ?? '';
}
