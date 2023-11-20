import { createContext, PropsWithChildren, useCallback, useMemo, useState } from "react";

export enum ModalType {
  EditMyList,
}

const initialModalContextValue = {
  modal: null as ModalType | null,
  setModal: (modal: ModalType | null) => {},
}

export type ModalContextType = typeof initialModalContextValue;

export const ModalContext = createContext(initialModalContextValue);

type ModalContextProviderProps = PropsWithChildren;
export const ModalContextProvider = ({children}: ModalContextProviderProps) => {
  const [modal, setModalState] = useState<ModalType | null>(null);
  const setModal = useCallback((modal: ModalType | null) => {
    setModalState(modal);
  }, []);

  const contextValue = useMemo(() => {
    return {
      modal,
      setModal,
    };
  }, [modal, setModal]);

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
    </ModalContext.Provider>
  );
};