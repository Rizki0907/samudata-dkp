export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
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
