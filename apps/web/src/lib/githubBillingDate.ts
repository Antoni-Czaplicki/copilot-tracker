export function parseBillingDate(value: string | null) {
  if (value === null || value === "") {
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return value;
}
