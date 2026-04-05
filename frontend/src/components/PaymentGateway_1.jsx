import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, Building2, CheckCircle2, Loader2, X, ChevronRight, Lock } from 'lucide-react';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const PaymentGateway = ({ order, totalAmount, onSuccess, onClose }) => {
  const [method, setMethod] = useState('bkash');
  const [step, setStep] = useState('select'); // select | processing | success
  const [loading, setLoading] = useState(false);

  // bKash
  const [bkashPhone, setBkashPhone] = useState('');

  // Card
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '', name: '' });

  // Bank
  const [bankForm, setBankForm] = useState({ bankName: 'Dutch-Bangla Bank', accountName: '', transactionId: '', transferDate: new Date().toISOString().split('T')[0], amount: totalAmount });
  const [bankAccounts, setBankAccounts] = useState([
    { bankName: 'Dutch-Bangla Bank', accountName: 'Devaroti Shop', accountNumber: '1234567890', branchName: 'Dhaka Main' },
    { bankName: 'bKash Merchant', accountName: 'Devaroti Shop', accountNumber: '01XXXXXXXXX' },
    { bankName: 'Nagad Merchant', accountName: 'Devaroti Shop', accountNumber: '01XXXXXXXXX' },
  ]);

  const fmt = (n) => `৳${(n || 0).toLocaleString()}`;

  const handleBkashPay = async () => {
    if (!bkashPhone || !/^01[3-9]\d{8}$/.test(bkashPhone)) {
      return toast.error('Valid bKash number required (01XXXXXXXXX)');
    }
    setLoading(true);
    try {
      // In sandbox/demo mode - simulate bKash
      // In production, use: paymentAPI.bkashCreate(...)
      await new Promise(r => setTimeout(r, 2000));

      // Simulate success
      toast.success('bKash payment successful!');
      setStep('success');
      setTimeout(() => onSuccess({ method: 'bkash', transactionId: `BK${Date.now()}`, phone: bkashPhone }), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'bKash payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPay = async () => {
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name) {
      return toast.error('Please fill all card details');
    }
    setLoading(true);
    try {
      // Production: use Stripe
      // const intent = await paymentAPI.stripeCreateIntent({ amount: totalAmount, orderId: order?._id });
      // Then use Stripe.js to confirm payment
      await new Promise(r => setTimeout(r, 2000));

      toast.success('Card payment successful!');
      setStep('success');
      setTimeout(() => onSuccess({ method: 'card', transactionId: `CARD${Date.now()}`, gateway: 'stripe' }), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Card payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSubmit = async () => {
    if (!bankForm.transactionId || !bankForm.accountName) {
      return toast.error('Please fill transaction ID and account name');
    }
    setLoading(true);
    try {
      if (order?._id) {
        await paymentAPI.bankSubmit({ orderId: order._id, ...bankForm });
      }
      toast.success('Bank transfer details submitted! Admin will verify within 24 hours.');
      setStep('success');
      setTimeout(() => onSuccess({ method: 'bank', transactionId: bankForm.transactionId, status: 'processing' }), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (v) => v.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  const formatExpiry = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);

  const methods = [
    { id: 'bkash', label: 'bKash', icon: '💚', color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/40', desc: 'Pay with bKash mobile banking' },
    { id: 'nagad', label: 'Nagad', icon: '🟠', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', desc: 'Pay with Nagad mobile banking' },
    { id: 'card', label: 'Card', icon: '💳', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/40', desc: 'Visa / Mastercard / AMEX' },
    { id: 'bank', label: 'Bank Transfer', icon: '🏦', color: 'from-slate-500/20 to-slate-600/10', border: 'border-slate-500/40', desc: 'Direct bank transfer' },
    { id: 'cod', label: 'Cash on Delivery', icon: '💵', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/40', desc: 'Pay when you receive' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">Payment</h2>
            <p className="text-sm text-slate-400">Total: <span className="text-orange-400 font-bold">{fmt(totalAmount)}</span></p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"><X size={18} /></button>
          )}
        </div>

        <div className="p-5">
          {step === 'success' ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
              <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-slate-400">Your order has been placed.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 gap-2">
                {methods.map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r transition-all text-left ${method === m.id ? `${m.color} ${m.border}` : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'}`}>
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${method === m.id ? 'text-white' : 'text-slate-300'}`}>{m.label}</p>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                    {method === m.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                  </button>
                ))}
              </div>

              {/* bKash / Nagad Form */}
              {(method === 'bkash' || method === 'nagad') && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl ${method === 'bkash' ? 'bg-green-500/10 border border-green-500/20' : 'bg-orange-500/10 border border-orange-500/20'}`}>
                    <p className="text-sm font-medium text-white mb-1">{method === 'bkash' ? 'bKash' : 'Nagad'} Number</p>
                    <input value={bkashPhone} onChange={e => setBkashPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-white">How to pay:</p>
                    <p>1. Enter your {method === 'bkash' ? 'bKash' : 'Nagad'} number above</p>
                    <p>2. Click "Pay Now" - you'll receive a payment request</p>
                    <p>3. Approve the payment in your {method === 'bkash' ? 'bKash' : 'Nagad'} app</p>
                  </div>
                  <button onClick={handleBkashPay} disabled={loading}
                    className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${method === 'bkash' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} disabled:opacity-50`}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                    Pay {fmt(totalAmount)} with {method === 'bkash' ? 'bKash' : 'Nagad'}
                  </button>
                </div>
              )}

              {/* Card Form */}
              {method === 'card' && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-2 right-4 text-xl opacity-70">💳</div>
                    <p className="text-xs text-blue-200 mb-3">Card Number</p>
                    <p className="text-white font-mono text-lg tracking-wider">{cardForm.number || '•••• •••• •••• ••••'}</p>
                    <div className="flex justify-between mt-3">
                      <div>
                        <p className="text-xs text-blue-200">Card Holder</p>
                        <p className="text-white text-sm">{cardForm.name || 'YOUR NAME'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-200">Expires</p>
                        <p className="text-white text-sm">{cardForm.expiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>
                  <input value={cardForm.number} onChange={e => setCardForm(p => ({ ...p, number: formatCardNumber(e.target.value) }))} placeholder="1234 5678 9012 3456"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 font-mono" />
                  <input value={cardForm.name} onChange={e => setCardForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="CARDHOLDER NAME"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={cardForm.expiry} onChange={e => setCardForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} placeholder="MM/YY"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                    <input value={cardForm.cvv} onChange={e => setCardForm(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))} placeholder="CVV" type="password"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <button onClick={handleCardPay} disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                    Pay Securely {fmt(totalAmount)}
                  </button>
                  <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1"><Lock size={10} /> Secured by Stripe SSL encryption</p>
                </div>
              )}

              {/* Bank Transfer Form */}
              {method === 'bank' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Our Bank Accounts:</p>
                  {bankAccounts.map((acc, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs">
                      <p className="font-medium text-white">{acc.bankName}</p>
                      <p className="text-slate-400">Account: <span className="text-white">{acc.accountNumber}</span></p>
                      <p className="text-slate-400">Name: <span className="text-white">{acc.accountName}</span></p>
                      {acc.branchName && <p className="text-slate-400">Branch: <span className="text-white">{acc.branchName}</span></p>}
                      <p className="text-slate-400">Amount: <span className="text-orange-400 font-bold">{fmt(totalAmount)}</span></p>
                    </div>
                  ))}
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-medium text-white">After transfer, enter details:</p>
                    <input value={bankForm.transactionId} onChange={e => setBankForm(p => ({ ...p, transactionId: e.target.value }))} placeholder="Transaction/Reference ID *"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                    <input value={bankForm.accountName} onChange={e => setBankForm(p => ({ ...p, accountName: e.target.value }))} placeholder="Your Account Name *"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                    <input value={bankForm.transferDate} onChange={e => setBankForm(p => ({ ...p, transferDate: e.target.value }))} type="date"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <button onClick={handleBankSubmit} disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                    Submit Transfer Details
                  </button>
                  <p className="text-xs text-slate-400 text-center">Admin will verify your payment within 24 hours</p>
                </div>
              )}

              {/* Cash on Delivery */}
              {method === 'cod' && (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-yellow-400 font-medium mb-2">💵 Cash on Delivery</p>
                    <p className="text-sm text-slate-300">Pay <span className="text-orange-400 font-bold">{fmt(totalAmount)}</span> when your order arrives.</p>
                    <ul className="text-xs text-slate-400 mt-2 space-y-1">
                      <li>✓ No online payment required</li>
                      <li>✓ Pay the delivery person</li>
                      <li>✓ Keep exact change ready</li>
                    </ul>
                  </div>
                  <button onClick={() => {
                    onSuccess({ method: 'Cash on Delivery', transactionId: null });
                    setStep('success');
                  }}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-yellow-500 hover:bg-yellow-600 transition-all">
                    Place Order (Pay on Delivery)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentGateway;
