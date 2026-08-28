import type {
  MetroEdge,
  MetroGraph,
  RideStep,
  RouteResult,
} from './types.ts';
import { yellow, gray, bold } from './colors.ts';

/**
 * Returns the terminus name to display as the direction of travel.
 *
 * Circular lines have no single terminus, so they return an empty string.
 */
function getDirection(
  graph: MetroGraph,
  line: string,
  stationsInSegment: string[],
): string {
  if (graph.circularLines.has(line)) return '';

  const route = graph.stationsByLine.get(line);
  if (!route || route.length === 0) return '';

  const first = stationsInSegment[0];
  const last = stationsInSegment[stationsInSegment.length - 1];
  const idxFirst = route.indexOf(first ?? '');
  const idxLast = route.indexOf(last ?? '');
  if (idxFirst === -1 || idxLast === -1) return '';
  // show direction
  if (idxFirst < idxLast) return ` ${route[route.length - 1]} 方向`;
  if (idxFirst > idxLast) return ` ${route[0]} 方向`;
  return '';
}

/**
 * Collapses the raw edge list into ride segments separated by transfers.
 *
 * Each transfer edge flushes the current ride segment and increments the
 * transfer counter. Consecutive ride edges on the same line are merged.
 */
function collectSteps(
  graph: MetroGraph,
  edges: MetroEdge[],
): { steps: RideStep[]; stationSegments: number; transferCount: number } {
  const steps: RideStep[] = [];
  let stationSegments = 0;
  let transferCount = 0;
  let currentLine: string | null = null;
  let currentStations: string[] = [];

  const flushRide = () => {
    if (currentLine !== null && currentStations.length > 1) {
      steps.push({
        type: 'ride',
        line: currentLine,
        stations: currentStations,
        direction: getDirection(graph, currentLine, currentStations),
      });
      stationSegments += currentStations.length - 1;
    }
    currentLine = null;
    currentStations = [];
  };

  for (const edge of edges) {
    if (edge.type === 'ride') {
      if (currentLine !== edge.line) {
        flushRide();
        currentLine = edge.line;
        currentStations = [edge.fromStation, edge.toStation];
      } else {
        // Extend the current segment, avoiding consecutive duplicates
        if (currentStations[currentStations.length - 1] !== edge.fromStation) {
          currentStations.push(edge.fromStation);
        }
        if (currentStations[currentStations.length - 1] !== edge.toStation) {
          currentStations.push(edge.toStation);
        }
      }
    } else {
      // Transfer: flush current ride, count the transfer
      flushRide();
      transferCount++;
    }
  }

  flushRide();
  return { steps, stationSegments, transferCount };
}

/**
 * Builds a RouteResult directly from an ordered list of edges.
 * This is used when we have already reconstructed a full path.
 */
export function buildRouteFromEdges(
  graph: MetroGraph,
  edges: MetroEdge[],
  totalCost: number,
): RouteResult {
  const { steps, stationSegments, transferCount } = collectSteps(graph, edges);
  const startStation = edges[0]?.type === 'ride' ? edges[0].fromStation : '';
  const lastEdge = edges[edges.length - 1];
  const destStation = lastEdge?.type === 'ride' ? lastEdge.toStation : '';
  return {
    start: startStation,
    dest: destStation,
    steps,
    stationSegments,
    transferCount,
    totalCost,
  };
}
/** Maps internal line identifiers to human-readable names. */
function formatLineName(line: string): string {
  if (line === '3_1') return 'North extension of Line 3';
  if (line === '14_1') return 'Extension of Line 14';
  return `Line ${line}`;
}

/**
 * Formats a RouteResult as a human-readable terminal string.
 *
 * @param result - A RouteResult returned by `buildRoute`.
 * @returns Multi-line formatted string, with ANSI color for line names.
 */
export function formatRoute(result: RouteResult): string {
  const out: string[] = [];

  out.push(`Target: ${bold(result.start)} ${gray('->')} ${bold(result.dest)}`);
  out.push('');

  for (const step of result.steps) {
    const name = formatLineName(step.line);
    const dir = step.direction ? ` ${step.direction}` : '';
    out.push(`${yellow(name)}${gray(dir)}`);
    out.push(step.stations.join(` ${gray('->')} `));
    out.push('');
  }
  
  out.push(`Total time: ${bold(String(result.totalCost))} min`);
  out.push(`Stations: ${bold(String(result.stationSegments))}, Transfers: ${bold(String(result.transferCount))}`);

  return out.join('\n');
}
