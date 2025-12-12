// src/context/DepositContext.jsx
import { createContext, useContext, useState } from 'react';
import DepositModal from '../components/DepositModal';

const DepositContext = createContext();

export function DepositProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openDepositModal = () => {
    setIsModalOpen(true); // INSTANT OPEN
  };

  const closeDepositModal = () => {
    setIsModalOpen(false);
  };

  return (
    <DepositContext.Provider value={{ openDepositModal, closeDepositModal, isModalOpen }}>
      {children}
      <DepositModal isOpen={isModalOpen} onClose={closeDepositModal} />
    </DepositContext.Provider>
  );
}

export const useDeposit = () => useContext(DepositContext);