import type { MetroGraph, MetroEdge, FindRouteResult } from './types.ts';
import { MinHeap } from './heap.ts';
import { stateKey } from './graph.ts';
import { buildRoute } from './route.ts';

interface PrevEntry {
  prevKey: string;
  edge: MetroEdge;
}

/**
 * Finds the minimum-cost route between two stations using Dijkstra's algorithm.
 *
 * The graph models each (station, line) pair as a separate node to correctly
 * account for transfer costs.
 */
export function findBestRoute(
  graph: MetroGraph,
  start: string,
  dest: string,
): FindRouteResult {
  if (!graph.linesByStation.has(start)) {
    return { error: `Missing departure station: ${start}` };
  }
  if (!graph.linesByStation.has(dest)) {
    return { error: `Missing destination: ${dest}` };
  }
  if (start === dest) {
    return { error: 'Departure and destination are the same.' };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, PrevEntry>();
  const heap = new MinHeap();

  // Seed all starting line-states with cost 0
  for (const line of graph.linesByStation.get(start)!) {
    const key = stateKey(start, line);
    dist.set(key, 0);
    heap.push({ key, cost: 0 });
  }

  let targetKey: string | null = null;
  let targetCost = Infinity;

  while (heap.size() > 0) {
    const { key, cost } = heap.pop()!;

    // Skip stale entries
    if (cost !== dist.get(key)) continue;

    const node = graph.states.get(key);
    if (!node) continue;

    if (node.station === dest) {
      targetKey = key;
      targetCost = cost;
      break;
    }

    for (const edge of graph.edges.get(key) ?? []) {
      const newCost = cost + edge.cost;
      if (newCost < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, newCost);
        prev.set(edge.to, { prevKey: key, edge });
        heap.push({ key: edge.to, cost: newCost });
      }
    }
  }

  if (!targetKey) {
    return { error: 'No route found.' };
  }

  return buildRoute(graph, targetKey, targetCost, prev);
}
