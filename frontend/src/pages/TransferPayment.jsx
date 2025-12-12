import { useState } from 'react';
import '../styles/TransferPayment.css';

function TransferPayment() {
  const [form, setForm] = useState({
    type: 'transfer',
    name: '',
    accountNumber: '',
    routing: '',
    amount: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <div className="transfer-payment">
      <h2><i className="fas fa-exchange-alt"></i> Transfer / Payment</h2>
      <form onSubmit={handleSubmit}>
        <select name="type" onChange={handleChange}>
          <option value="transfer">Transfer Between Accounts</option>
          <option value="send">Send Money</option>
          <option value="bill">Pay Bills</option>
        </select>
        {form.type === 'send' && (
          <>
            <input type="text" name="name" placeholder="Recipient Name" onChange={handleChange} />
            <input type="text" name="accountNumber" placeholder="Account Number" onChange={handleChange} />
            <input type="text" name="routing" placeholder="Routing/SWIFT" onChange={handleChange} />
          </>
        )}
        <input type="number" name="amount" placeholder="Amount" onChange={handleChange} />
        <textarea name="notes" placeholder="Notes" onChange={handleChange}></textarea>
        <button type="submit"><i className="fas fa-paper-plane"></i> Submit</button>
      </form>
    </div>
  );
}

export default TransferPayment;