export interface LineData {
  name: string;
  circular?: boolean;
  stations: string[];
}

export interface MetroOptions {
  segmentTime?: number;
  transferTime?: number;
  circularLines?: string[];
}

/** A graph node: one station on one line. */
export interface StateNode {
  station: string;
  line: string;
}

export interface RideEdge {
  type: 'ride';
  to: string;
  line: string;
  fromStation: string;
  toStation: string;
  cost: number;
}

export interface TransferEdge {
  type: 'transfer';
  to: string;
  station: string;
  fromLine: string;
  toLine: string;
  cost: number;
}

export type MetroEdge = RideEdge | TransferEdge;

export interface RideStep {
  type: 'ride';
  line: string;
  stations: string[];
  direction: string;
}

export interface RouteResult {
  start: string;
  dest: string;
  steps: RideStep[];
  stationSegments: number;
  transferCount: number;
  totalCost: number;
}

export interface RouteError {
  error: string;
}

export interface MetroGraph {
  linesByStation: Map<string, Set<string>>;
  stationsByLine: Map<string, string[]>;
  circularLines: Set<string>;
  states: Map<string, StateNode>;
  edges: Map<string, MetroEdge[]>;
}
