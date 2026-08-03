export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('id-ID').format(number);
};

export const formatRupiahSingkat = (number) => {
  if (!number) return { value: '0', unit: '' };
  if (number >= 1000000000) {
    return {
      value: (number / 1000000000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      unit: 'Milyar'
    };
  }
  if (number >= 1000000) {
    return {
      value: (number / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      unit: 'Juta'
    };
  }
  if (number >= 1000) {
    return {
      value: (number / 1000).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      unit: 'Ribu'
    };
  }
  return {
    value: new Intl.NumberFormat('id-ID').format(number),
    unit: ''
  };
};

