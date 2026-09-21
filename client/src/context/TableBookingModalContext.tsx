import { createContext, useContext, useState, type ReactNode } from "react";

interface ModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const TableBookingModalContext = createContext<ModalState | null>(null);

export function TableBookingModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <TableBookingModalContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </TableBookingModalContext.Provider>
  );
}

export function useTableBookingModal() {
  const ctx = useContext(TableBookingModalContext);
  if (!ctx) throw new Error("useTableBookingModal must be used within TableBookingModalProvider");
  return ctx;
}
