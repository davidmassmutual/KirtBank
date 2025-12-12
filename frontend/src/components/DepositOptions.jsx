import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DepositOptions.css';

function DepositOptions() {
  const [selectedOption, setSelectedOption] = useState('');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const depositOptions = [
    
    {
      method: 'Crypto',
      accountNumber: '0xa49a10d8F662A043243A2b66a922e5ebB1e05250',
      bankName: 'USDT',
    },
  ];

  const handleProceed = () => {
    if (!selectedOption || !amount) {
      toast.error('Please select an option and enter an amount');
      return;
    }
    const option = depositOptions.find((opt) => opt.method === selectedOption);
    navigate('/deposit-details', { state: { option, amount } });
  };

  return (
    <div className="deposit-options">
      <h3>Deposit Funds</h3>
      <select
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
        placeholder="Select Deposit Method"
      >
        <option value="" disabled>
          Select Deposit Method
        </option>
        {depositOptions.map((option) => (
          <option key={option.method} value={option.method}>
            {option.method}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter Amount"
      />
      <button onClick={handleProceed}>Proceed</button>
    </div>
  );
}

export default DepositOptions;