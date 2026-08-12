/**
  * Formats a numeric amount into Indian Rupee format (en-IN)
  * Examples: 500 -> ₹500, 1500 -> ₹1,500, 100000 -> ₹1,00,000
  */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount)) return '₹0';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2,
  });

  return formatter.format(amount);
}

/**
 * Formats a YYYY-MM-DD date string into Indian format DD/MM/YYYY
 */
export function formatDateIN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
