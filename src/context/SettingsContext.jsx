import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/axios';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Initialize with fallback defaults
  const [localization, setLocalization] = useState({
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    language: 'English',
  });

  const refreshSettings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setLocalization({
          timezone: res.data.timezone || 'Asia/Kolkata',
          currency: res.data.currency || 'INR',
          dateFormat: res.data.date_format || 'DD/MM/YYYY',
          language: res.data.language || 'English',
        });
      }
    } catch (err) {
      // Fallback silently if /settings fails or unavailable
    }
  }, [user]);

  // Whenever the user logs in or updates profile, sync their settings
  useEffect(() => {
    if (user && user.localization) {
      setLocalization({
        timezone: user.localization.timezone || 'Asia/Kolkata',
        currency: user.localization.currency || 'INR',
        dateFormat: user.localization.date_format || 'DD/MM/YYYY',
        language: user.localization.language || 'English',
      });
    }
    refreshSettings();
  }, [user, refreshSettings]);

  // Currency Formatter Helper
  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    const currencyMap = {
      'INR': { locale: 'en-IN', currency: 'INR' },
      'USD': { locale: 'en-US', currency: 'USD' },
      'AED': { locale: 'ar-AE', currency: 'AED' },
      'EUR': { locale: 'de-DE', currency: 'EUR' },
      'GBP': { locale: 'en-GB', currency: 'GBP' },
      'ZAR': { locale: 'en-ZA', currency: 'ZAR' },
      'SGD': { locale: 'en-SG', currency: 'SGD' }
    };
    
    const config = currencyMap[localization.currency] || currencyMap['USD'];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency
    }).format(num);
  };

  const currencySymbol = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'AED',
    'ZAR': 'R',
    'SGD': 'S$'
  }[localization.currency] || '$';

  // Date Formatter Helper
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d)) return 'Invalid Date';

    // Set Timezone and Format
    const options = {
      timeZone: localization.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }

    const formatter = new Intl.DateTimeFormat('en-GB', options); // 'en-GB' maps closely to DD/MM/YYYY
    const parts = formatter.formatToParts(d);
    
    // Custom mapping for format
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;

    let formattedDate = `${day}/${month}/${year}`;
    if (localization.dateFormat === 'MM/DD/YYYY') formattedDate = `${month}/${day}/${year}`;
    if (localization.dateFormat === 'YYYY-MM-DD') formattedDate = `${year}-${month}-${day}`;

    if (includeTime) {
      const hour = parts.find(p => p.type === 'hour')?.value;
      const minute = parts.find(p => p.type === 'minute')?.value;
      formattedDate += ` ${hour}:${minute}`;
    }

    return formattedDate;
  };

  return (
    <SettingsContext.Provider value={{ localization, setLocalization, formatCurrency, formatDate, currencySymbol, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

