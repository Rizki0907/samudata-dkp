import { useState, useCallback } from 'react';

export const usePromptModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
    reject: null
  });

  const prompt = useCallback((title, message) => {
    return new Promise((resolve, reject) => {
      setModalState({
        isOpen: true,
        title,
        message,
        resolve,
        reject
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setModalState(prev => {
      if (prev.resolve) prev.resolve(null);
      return { ...prev, isOpen: false };
    });
  }, []);

  const handleSubmit = useCallback((value) => {
    setModalState(prev => {
      if (prev.resolve) prev.resolve(value);
      return { ...prev, isOpen: false };
    });
  }, []);

  return {
    prompt,
    modalProps: {
      isOpen: modalState.isOpen,
      title: modalState.title,
      message: modalState.message,
      onClose: handleClose,
      onSubmit: handleSubmit
    }
  };
};
