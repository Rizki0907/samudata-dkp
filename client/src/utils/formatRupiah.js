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

export const formatUangPendek = (number) => {
  if (!number) return '0';
  const num = Number(number);
  if (isNaN(num)) return '0';

  if (num >= 1000000000000000) {
    return (num / 1000000000000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kuadriliun';
  }
  if (num >= 1000000000000) {
    return (num / 1000000000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Triliun';
  }
  if (num >= 1000000000) {
    return (num / 1000000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Miliar';
  }
  if (num >= 1000000) {
    return (num / 1000000).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Juta';
  }
  return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

