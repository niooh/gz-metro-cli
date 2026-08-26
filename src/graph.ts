import type { LineData, MetroEdge, MetroGraph, StateNode } from './types.ts';

const STATE_SEP = '\u0000';

export function stateKey(station: string, line: string): string {
  return `${station}${STATE_SEP}${line}`;
}

function ensureState(
  states: Map<string, StateNode>,
  station: string,
  line: string,
): string {
  const key = stateKey(station, line);
  if (!states.has(key)) {
    states.set(key, { station, line });
  }
  return key;
}

function addEdge(edges: Map<string, MetroEdge[]>, from: string, edge: MetroEdge): void {
  let list = edges.get(from);
  if (!list) {
    list = [];
    edges.set(from, list);
  }
  list.push(edge);
}

function addRideEdges(
  graph: MetroGraph,
  fromStation: string,
  toStation: string,
  line: string,
  cost: number,
): void {
  const fromKey = ensureState(graph.states, fromStation, line);
  const toKey = ensureState(graph.states, toStation, line);
  addEdge(graph.edges, fromKey, { type: 'ride', to: toKey, line, fromStation, toStation, cost });
  addEdge(graph.edges, toKey, { type: 'ride', to: fromKey, line, fromStation: toStation, toStation: fromStation, cost });
}

function addTransferEdges(
  graph: MetroGraph,
  station: string,
  lineA: string,
  lineB: string,
  cost: number,
): void {
  const keyA = ensureState(graph.states, station, lineA);
  const keyB = ensureState(graph.states, station, lineB);
  addEdge(graph.edges, keyA, { type: 'transfer', to: keyB, station, fromLine: lineA, toLine: lineB, cost });
  addEdge(graph.edges, keyB, { type: 'transfer', to: keyA, station, fromLine: lineB, toLine: lineA, cost });
}

/**
 * Builds the metro graph from raw line data.
 *
 * Each node represents a (station, line) pair. Edges are either rides
 * between adjacent stations on the same line, or transfers between lines
 * at the same station.
 */
export function buildGraph(
  linesData: LineData[],
  segmentTime: number,
  transferTime: number,
  extraCircular: Set<string>,
): MetroGraph {
  const graph: MetroGraph = {
    linesByStation: new Map(),
    stationsByLine: new Map(),
    circularLines: new Set(extraCircular),
    states: new Map(),
    edges: new Map(),
  };

  // Parse station lists and mark circular lines
  for (const lineInfo of linesData) {
    const { name: line, stations, circular } = lineInfo;

    if (circular || extraCircular.has(line)) {
      graph.circularLines.add(line);
    }

    if (!graph.stationsByLine.has(line)) {
      graph.stationsByLine.set(line, []);
    }
    const route = graph.stationsByLine.get(line)!;

    for (const station of stations) {
      // Deduplicate consecutive duplicates in the raw data
      if (route[route.length - 1] !== station) {
        route.push(station);
      }

      let lineSet = graph.linesByStation.get(station);
      if (!lineSet) {
        lineSet = new Set();
        graph.linesByStation.set(station, lineSet);
      }
      lineSet.add(line);
    }
  }

  // Ride edges: adjacent stations along each line
  for (const [line, route] of graph.stationsByLine) {
    for (let i = 0; i < route.length - 1; i++) {
      addRideEdges(graph, route[i]!, route[i + 1]!, line, segmentTime);
    }
    if (graph.circularLines.has(line) && route.length > 1) {
      addRideEdges(graph, route[route.length - 1]!, route[0]!, line, segmentTime);
    }
  }

  // Transfer edges: between all lines sharing a station
  for (const [station, lineSet] of graph.linesByStation) {
    const lineList = [...lineSet];
    for (let i = 0; i < lineList.length; i++) {
      for (let j = i + 1; j < lineList.length; j++) {
        addTransferEdges(graph, station, lineList[i]!, lineList[j]!, transferTime);
      }
    }
  }

  return graph;
}
