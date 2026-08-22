import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

const InvoiceModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; line-height: 1.6; }
            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #2563eb; font-size: 28px; }
            .header-right { text-align: right; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8fafc; font-weight: 600; color: #1e293b; }
            .totals { width: 50%; float: right; }
            .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .totals-row.grand-total { font-weight: bold; font-size: 18px; color: #2563eb; border-bottom: none; border-top: 2px solid #ddd; padding-top: 15px; }
            .footer { clear: both; margin-top: 50px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <h1>INVOICE</h1>
                <p style="margin-top: 5px; color: #64748b;">News CMS Media Group</p>
              </div>
              <div class="header-right">
                <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br/>
                <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}<br/>
                <strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}
              </div>
            </div>
            
            <div class="details">
              <div>
                <h3 style="margin-top:0; color:#475569;">Billed To:</h3>
                <p>Client ID: ${invoice.client}</p>
                <p>Ad Booking ID: ${invoice.adBooking}</p>
              </div>
              <div style="text-align: right;">
                <h3 style="margin-top:0; color:#475569;">Status:</h3>
                <p style="font-weight: bold; color: ${invoice.status === 'Draft' ? '#eab308' : '#22c55e'}; text-transform: uppercase;">${invoice.status}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Advertisement Booking (Grid Position)</td>
                  <td style="text-align: right;">Tk. ${invoice.subtotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>Tk. ${invoice.subtotal.toLocaleString()}</span>
              </div>
              <div class="totals-row">
                <span>Discount:</span>
                <span style="color: #ef4444;">- Tk. ${invoice.discount.toLocaleString()}</span>
              </div>
              <div class="totals-row">
                <span>VAT / Tax:</span>
                <span>Tk. ${invoice.tax.toLocaleString()}</span>
              </div>
              <div class="totals-row grand-total">
                <span>Total Amount:</span>
                <span>Tk. ${invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="footer">
              Thank you for your business!
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Booking Confirmed!</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Your invoice has been generated automatically.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Invoice Preview) */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-dashed border-gray-200 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <FileText size={20} />
                  INVOICE
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                  {invoice.status}
                </span>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">Tk. {invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">Discount:</span>
                <span className="font-medium text-red-500">- Tk. {invoice.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">VAT / Tax:</span>
                <span className="font-medium text-gray-900 dark:text-white">Tk. {invoice.tax.toLocaleString()}</span>
              </div>
              
              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900 dark:text-white">Total Amount:</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">Tk. {invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex gap-3 justify-end bg-white dark:bg-slate-900">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20"
          >
            <Printer size={18} />
            Print PDF
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
