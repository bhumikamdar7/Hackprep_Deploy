export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PeriodSQLFilter {
  whereClause: string;
  params: any[];
  label: string;
}

export function getPeriodFilter(period: TimePeriod): PeriodSQLFilter {
  switch (period) {
    case 'daily':
      return {
        whereClause: "strftime('%Y-%m-%d', date) = strftime('%Y-%m-%d', 'now', 'localtime')",
        params: [],
        label: "Today",
      };
    case 'weekly':
      return {
        whereClause: "date >= date('now', '-7 days', 'localtime')",
        params: [],
        label: "Past 7 Days",
      };
    case 'yearly':
      return {
        whereClause: "strftime('%Y', date) = strftime('%Y', 'now', 'localtime')",
        params: [],
        label: "This Year",
      };
    case 'monthly':
    default:
      return {
        whereClause: "strftime('%Y-%m', date) = strftime('%Y-%m', 'now', 'localtime')",
        params: [],
        label: "This Month",
      };
  }
}
