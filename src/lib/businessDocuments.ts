import type { CustomerRecord, InvoiceRecord, PurchaseOrderRecord, QuoteRecord, SupplierRecord } from '../context/AppContext';

type Party = CustomerRecord | SupplierRecord | null | undefined;

interface PrintableDocument {
  title: string;
  documentId: string;
  status: string;
  issuedAt?: string;
  dueAt?: string;
  partyLabel: string;
  party: Party;
  description: string;
  amountLabel: string;
  amount: number;
  secondaryRows?: Array<{ label: string; value: string }>;
  approvalRows?: Array<{ label: string; value: string }>;
}

export interface PrintableDocumentResult {
  ok: boolean;
  message: string;
}

const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

export function openQuoteDocument(quote: QuoteRecord, customer: CustomerRecord | undefined): PrintableDocumentResult {
  return openPrintableDocument(renderDocument({
    title: 'Quotation',
    documentId: quote.id,
    status: quote.status,
    issuedAt: quote.createdAt,
    dueAt: quote.validUntil,
    partyLabel: 'Customer',
    party: customer,
    description: quote.description || 'IT hardware supply package',
    amountLabel: 'Quote total',
    amount: quote.totalValue,
    secondaryRows: [
      { label: 'Gross margin', value: `${quote.grossMargin}%` },
      { label: 'Validity', value: formatDate(quote.validUntil) },
    ],
  }));
}

export function openInvoiceDocument(invoice: InvoiceRecord, customer: CustomerRecord | undefined): PrintableDocumentResult {
  const balance = Math.max(invoice.amount - invoice.paidAmount, 0);
  return openPrintableDocument(renderDocument({
    title: 'Invoice',
    documentId: invoice.id,
    status: invoice.status,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueDate,
    partyLabel: 'Bill to',
    party: customer,
    description: invoice.description || 'IT hardware supply package',
    amountLabel: 'Invoice total',
    amount: invoice.amount,
    secondaryRows: [
      { label: 'Paid amount', value: currencyFormatter.format(invoice.paidAmount) },
      { label: 'Balance due', value: currencyFormatter.format(balance) },
      { label: 'Due date', value: formatDate(invoice.dueDate) },
    ],
  }));
}

export function openPurchaseOrderDocument(purchaseOrder: PurchaseOrderRecord, supplier: SupplierRecord | undefined): PrintableDocumentResult {
  return openPrintableDocument(renderDocument({
    title: 'Purchase Order',
    documentId: purchaseOrder.id,
    status: purchaseOrder.status,
    issuedAt: purchaseOrder.createdAt,
    dueAt: purchaseOrder.expectedAt,
    partyLabel: 'Supplier',
    party: supplier,
    description: purchaseOrder.description || 'IT hardware procurement order',
    amountLabel: 'PO total',
    amount: purchaseOrder.totalCost,
    secondaryRows: [
      { label: 'Expected arrival', value: formatDate(purchaseOrder.expectedAt) },
    ],
    approvalRows: [
      { label: 'Approval status', value: purchaseOrder.approvalStatus || 'not_required' },
      { label: 'Approval reason', value: purchaseOrder.approvalReason || '-' },
      { label: 'Approved by', value: purchaseOrder.approvedBy || '-' },
      { label: 'Approved at', value: formatDate(purchaseOrder.approvedAt) },
    ],
  }));
}

function openPrintableDocument(html: string): PrintableDocumentResult {
  const child = window.open('about:blank', '_blank', 'width=960,height=1100');
  if (!child) {
    return { ok: false, message: 'Browser blocked the document window. Allow popups and try again.' };
  }

  child.opener = null;
  child.document.open();
  child.document.write(html);
  child.document.close();
  child.focus();
  return { ok: true, message: 'Printable document opened.' };
}

function renderDocument(document: PrintableDocument): string {
  const secondaryRows = document.secondaryRows ?? [];
  const approvalRows = document.approvalRows ?? [];
  const partyLines = renderPartyLines(document.party);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.title)} ${escapeHtml(document.documentId)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, sans-serif; }
    .sheet { width: min(920px, 100%); min-height: 100vh; margin: 0 auto; padding: 48px; background: #fff; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 24px; }
    h1 { margin: 0; font-size: 34px; letter-spacing: 0; }
    .brand { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .muted { color: #6b7280; }
    .meta { text-align: right; line-height: 1.7; }
    .section { margin-top: 28px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 12px; text-align: left; vertical-align: top; }
    th { background: #f9fafb; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #374151; }
    .amount { text-align: right; white-space: nowrap; }
    .total { margin-top: 24px; display: flex; justify-content: flex-end; }
    .total-card { min-width: 280px; border: 2px solid #111827; border-radius: 8px; padding: 18px; }
    .total-card strong { display: block; font-size: 28px; margin-top: 8px; }
    .footer { margin-top: 52px; display: grid; grid-template-columns: 1fr 1fr; gap: 36px; }
    .signature { border-top: 1px solid #111827; padding-top: 10px; min-height: 48px; }
    .print-actions { position: fixed; right: 24px; bottom: 24px; display: flex; gap: 8px; }
    button { border: 0; border-radius: 6px; background: #111827; color: white; padding: 10px 14px; cursor: pointer; }
    @media print {
      body { background: #fff; }
      .sheet { padding: 24px; }
      .print-actions { display: none; }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="top">
      <div>
        <div class="brand">Nitro Tech Supply</div>
        <div class="muted">AI-powered IT hardware wholesale and retail</div>
        <div class="muted">Thailand</div>
      </div>
      <div class="meta">
        <h1>${escapeHtml(document.title)}</h1>
        <div><strong>ID:</strong> ${escapeHtml(document.documentId)}</div>
        <div><strong>Status:</strong> ${escapeHtml(document.status)}</div>
        <div><strong>Issued:</strong> ${escapeHtml(formatDate(document.issuedAt))}</div>
      </div>
    </section>

    <section class="section grid">
      <div class="box">
        <div class="label">${escapeHtml(document.partyLabel)}</div>
        ${partyLines}
      </div>
      <div class="box">
        <div class="label">Document details</div>
        ${renderRows([
          { label: 'Document ID', value: document.documentId },
          { label: 'Due / valid until', value: formatDate(document.dueAt) },
          ...secondaryRows,
          ...approvalRows,
        ])}
      </div>
    </section>

    <section class="section">
      <div class="label">Line item</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="amount">Qty</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(document.description)}</td>
            <td class="amount">1</td>
            <td class="amount">${escapeHtml(currencyFormatter.format(document.amount))}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="total">
      <div class="total-card">
        <span>${escapeHtml(document.amountLabel)}</span>
        <strong>${escapeHtml(currencyFormatter.format(document.amount))}</strong>
      </div>
    </section>

    <section class="footer">
      <div class="signature">Prepared by Nitro Tech Supply</div>
      <div class="signature">Approved / received by</div>
    </section>
  </main>
  <div class="print-actions">
    <button onclick="window.print()">Print / Save PDF</button>
    <button onclick="window.close()">Close</button>
  </div>
</body>
</html>`;
}

function renderPartyLines(party: Party): string {
  if (!party) return '<div>Unknown party</div>';
  const lines = [
    party.name,
    'contactName' in party ? party.contactName : undefined,
    party.phone,
    party.email,
    'address' in party ? party.address : undefined,
    'paymentTerms' in party ? `Payment terms: ${party.paymentTerms}` : undefined,
  ].filter((line): line is string => Boolean(line));

  return lines.map(line => `<div>${escapeHtml(line)}</div>`).join('');
}

function renderRows(rows: Array<{ label: string; value: string }>): string {
  return rows
    .map(row => `<div><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</div>`)
    .join('');
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
