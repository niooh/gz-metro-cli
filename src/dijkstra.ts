import type { MetroGraph, MetroEdge, RouteResult } from './types.ts';
import { MinHeap } from './heap.ts';
import { stateKey } from './graph.ts';
import { buildRouteFromEdges } from './route.ts';

interface PrevEntry {
  prevKey: string;
  edge: MetroEdge;
}

interface DijkstraResult {
  prev: Map<string, PrevEntry[]>;
  targetKeys: string[];
  minCost: number;
}

/**
 * Runs Dijkstra's algorithm on the metro graph, keeping all shortest
 * predecessors. Does not stop early; explores the entire reachable graph.
 */
function runDijkstra(
  graph: MetroGraph,
  start: string,
  dest: string,
): DijkstraResult | { error: string } {
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
  const prev = new Map<string, PrevEntry[]>();
  const heap = new MinHeap();

  // Seed all starting line-states with cost 0
  for (const line of graph.linesByStation.get(start)!) {
    const key = stateKey(start, line);
    dist.set(key, 0);
    heap.push({ key, cost: 0 });
  }

  while (heap.size() > 0) {
    const { key, cost } = heap.pop()!;

    // Skip stale entries
    if (cost !== dist.get(key)) continue;

    const node = graph.states.get(key);
    if (!node) continue;

    for (const edge of graph.edges.get(key) ?? []) {
      const newCost = cost + edge.cost;
      const oldCost = dist.get(edge.to);

      if (oldCost === undefined || newCost < oldCost) {
        // Found a strictly better path: update distance and reset predecessors
        dist.set(edge.to, newCost);
        prev.set(edge.to, [{ prevKey: key, edge }]);
        heap.push({ key: edge.to, cost: newCost });
      } else if (newCost === oldCost) {
        // Another path of equal cost: keep both predecessors
        const list = prev.get(edge.to) ?? [];
        list.push({ prevKey: key, edge });
        prev.set(edge.to, list);
      }
    }
  }

  // Collect all destination line-states with minimum total cost
  let minCost = Infinity;
  const targetKeys: string[] = [];

  for (const [key, node] of graph.states) {
    if (node.station === dest) {
      const cost = dist.get(key);
      if (cost !== undefined) {
        if (cost < minCost) {
          minCost = cost;
          targetKeys.length = 0;
          targetKeys.push(key);
        } else if (cost === minCost) {
          targetKeys.push(key);
        }
      }
    }
  }

  if (targetKeys.length === 0) {
    return { error: 'No route found.' };
  }

  return { prev, targetKeys, minCost };
}

/**
 * Recursively enumerates all edge sequences from a target state back to
 * any start state using the multi-predecessor map.
 */
function enumeratePaths(
  targetKey: string,
  prev: Map<string, PrevEntry[]>,
): MetroEdge[][] {
  const paths: MetroEdge[][] = [];

  function dfs(key: string, currentEdges: MetroEdge[]) {
    const entries = prev.get(key);
    if (!entries || entries.length === 0) {
      // Reached a start state; store the reversed edge sequence
      paths.push([...currentEdges].reverse());
      return;
    }
    for (const entry of entries) {
      currentEdges.push(entry.edge);
      dfs(entry.prevKey, currentEdges);
      currentEdges.pop();
    }
  }

  dfs(targetKey, []);
  return paths;
}

/**
 * Finds all routes with the minimum total time between two stations.
 * The returned routes are deduplicated and sorted by number of transfers
 * (ascending). The first element is therefore the best route with the
 * fewest transfers among all shortest-time routes.
 */
export function findAllBestRoutes(
  graph: MetroGraph,
  start: string,
  dest: string,
): { routes: RouteResult[] } | { error: string } {
  const dijkstraResult = runDijkstra(graph, start, dest);
  if ('error' in dijkstraResult) {
    return dijkstraResult;
  }

  const { prev, targetKeys, minCost } = dijkstraResult;

  // Enumerate all edge sequences for every target state
  const allEdgeSequences: MetroEdge[][] = [];
  for (const targetKey of targetKeys) {
    allEdgeSequences.push(...enumeratePaths(targetKey, prev));
  }

  // Build RouteResult for each edge sequence
  const allRoutes: RouteResult[] = allEdgeSequences.map((edges) =>
    buildRouteFromEdges(graph, edges, minCost),
  );

  // Deduplicate based on the sequence of ride steps (line + station list)
  const uniqueRoutes = new Map<string, RouteResult>();
  for (const route of allRoutes) {
    const signature = JSON.stringify(
      route.steps.map((s) => ({
        line: s.line,
        stations: s.stations,
        direction: s.direction,
      })),
    );
    if (!uniqueRoutes.has(signature)) {
      uniqueRoutes.set(signature, route);
    }
  }

  // Sort by transfer count (ascending), then by station count as tiebreaker
  const routes = [...uniqueRoutes.values()].sort(
    (a, b) =>
      a.transferCount - b.transferCount ||
      a.stationSegments - b.stationSegments,
  );

  return { routes };
}
