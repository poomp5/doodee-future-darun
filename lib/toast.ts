import toast from 'react-hot-toast';
import { createElement } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast utility wrapper for react-hot-toast with Doodee theme
 * Provides consistent styling and behavior across the app
 */

const defaultOptions = {
  duration: 3000,
  position: 'top-center' as const,
  style: {
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export const showToast = {
  success: (message: string, options?: any) => {
    return toast.success(message, {
      ...defaultOptions,
      icon: createElement(CheckCircle2, { size: 16, className: 'text-white' }),
      style: {
        ...defaultOptions.style,
        background: '#10b981',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return toast.error(message, {
      ...defaultOptions,
      icon: createElement(XCircle, { size: 16, className: 'text-white' }),
      style: {
        ...defaultOptions.style,
        background: '#ef4444',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return toast(message, {
      ...defaultOptions,
      icon: createElement(AlertTriangle, { size: 16, className: 'text-white' }),
      style: {
        ...defaultOptions.style,
        background: '#f59e0b',
        color: '#fff',
      },
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return toast(message, {
      ...defaultOptions,
      icon: createElement(Info, { size: 16, className: 'text-white' }),
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
        color: '#fff',
      },
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: any
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...defaultOptions,
        success: {
          style: {
            ...defaultOptions.style,
            background: '#10b981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        error: {
          style: {
            ...defaultOptions.style,
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        ...options,
      }
    );
  },

  custom: (message: string, options?: any) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
    });
  },
};

// Re-export the original toast for advanced usage
export { toast };
