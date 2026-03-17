export function formatPrice(price: number): string {
  return `₹ ${price.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getDepartureTime(stops: { stopName: string; departureTime?: string }[]): string {
  return stops[0]?.departureTime || '--';
}

export function getArrivalTime(stops: { stopName: string; arrivalTime?: string }[]): string {
  const last = stops[stops.length - 1];
  return last?.arrivalTime || '--';
}

export function getDuration(dep: string, arr: string): string {
  try {
    const parse = (t: string) => {
      const [time, meridiem] = t.split(' ');
      let [h, m] = time.split(':').map(Number);
      if (meridiem === 'PM' && h !== 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    let diff = parse(arr) - parse(dep);
    if (diff < 0) diff += 24 * 60;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } catch {
    return '';
  }
}
