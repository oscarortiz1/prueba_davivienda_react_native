/**
 * Toast Store
 * Global state management for toast notifications
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,

  showToast: (message: string, type: ToastType) => {
    set({ message, type, visible: true });
  },

  hideToast: () => {
    set({ visible: false });
  },

  success: (message: string) => {
    set({ message, type: 'success', visible: true });
  },

  error: (message: string) => {
    set({ message, type: 'error', visible: true });
  },

  info: (message: string) => {
    set({ message, type: 'info', visible: true });
  },

  warning: (message: string) => {
    set({ message, type: 'warning', visible: true });
  },
}));
