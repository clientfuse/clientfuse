export class ListFormatter {
  static formatItemsList(
    items: string[],
    emptyText: string = 'No items'
  ): string {
    if (items.length === 0) return emptyText;
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;

    const allButLast = items.slice(0, -1);
    const lastItem = items[items.length - 1];
    return `${allButLast.join(', ')} and ${lastItem}`;
  }
}
