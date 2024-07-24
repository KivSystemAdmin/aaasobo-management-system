// This file contains common functions that are used in multiple controllers.

// Create a new object that contains only the properties specified in the array.
export const pickProperties = (
  dBData: any,
  properties: string[],
  mapping?: { [key: string]: string },
) => {
  const pickedProperties: any = {};
  properties.forEach((property) => {
    if (dBData.hasOwnProperty(property)) {
      if (!mapping) {
        pickedProperties[property] = dBData[property];
      } else {
        const newPropertyName = mapping[property] || property;
        pickedProperties[newPropertyName] = dBData[property];
      }
    }
  });
  return pickedProperties;
};

export function getEndOfNextMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 2);
  d.setUTCDate(0);
  d.setUTCHours(23, 59, 59);
  return d;
}

// Generate the data between `from` and `until` dates including `until`.
export function createDatesBetween(start: Date, end: Date): Date[] {
  const dates = [];
  while (start <= end) {
    dates.push(new Date(start));
    start.setUTCDate(start.getUTCDate() + 7);
  }
  return dates;
}
