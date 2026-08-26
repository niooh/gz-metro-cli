export interface HeapItem {
  key: string;
  cost: number;
}

/** Min-heap keyed on `cost`, used by Dijkstra's algorithm. */
export class MinHeap {
  private heap: HeapItem[] = [];

  size(): number { return this.heap.length; }

  push(item: HeapItem): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapItem | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0]!;
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    const item = this.heap[i]!;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent]!.cost <= item.cost) break;
      this.heap[i] = this.heap[parent]!;
      i = parent;
    }
    this.heap[i] = item;
  }

  private sinkDown(i: number): void {
    const item = this.heap[i]!;
    const len = this.heap.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < len && this.heap[l]!.cost < this.heap[smallest]!.cost) smallest = l;
      if (r < len && this.heap[r]!.cost < this.heap[smallest]!.cost) smallest = r;
      if (smallest === i) break;
      this.heap[i] = this.heap[smallest]!;
      this.heap[smallest] = item;
      i = smallest;
    }
    this.heap[i] = item;
  }
}
