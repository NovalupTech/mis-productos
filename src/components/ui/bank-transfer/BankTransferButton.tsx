'use client';

import { useState } from 'react';
import { IoWalletOutline, IoChevronDownOutline, IoChevronUpOutline } from 'react-icons/io5';

interface Props {
  orderId: string;
  amount: number;
  config: {
    bankName: string;
    accountHolder: string;
    cbu: string;
    alias?: string;
    dni?: string;
    notes?: string;
  };
}

export const BankTransferButton = ({ orderId: _orderId, amount: _amount, config }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 mb-2"
      >
        <IoWalletOutline size={20} />
        <span>Transferencia Bancaria</span>
        {isOpen ? (
          <IoChevronUpOutline size={20} className="ml-auto" />
        ) : (
          <IoChevronDownOutline size={20} className="ml-auto" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div>
              <span className="font-medium">Banco:</span> {config.bankName}
            </div>
            <div>
              <span className="font-medium">Titular:</span> {config.accountHolder}
            </div>
            <div>
              <span className="font-medium">CBU:</span> {config.cbu}
            </div>
            {config.alias && (
              <div>
                <span className="font-medium">Alias:</span> {config.alias}
              </div>
            )}
            {config.dni && (
              <div>
                <span className="font-medium">DNI:</span> {config.dni}
              </div>
            )}
            {config.notes && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <span className="font-medium">Notas:</span> {config.notes}
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            <p className="font-medium mb-1">Importante:</p>
            <p>Una vez realizada la transferencia, envía el comprobante al vendedor para confirmar tu pago.</p>
          </div>
        </div>
      )}
    </div>
  );
};
