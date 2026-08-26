import { fileURLToPath } from 'node:url';
import path from 'node:path';

import type { FindRouteResult, MetroOptions, RouteResult } from './types.ts';
import { lines } from './lines.ts';
import { buildGraph } from './graph.ts';
import { findBestRoute } from './dijkstra.ts';
import { formatRoute } from './route.ts';

const DEFAULT_SEGMENT_TIME = 2;   // minutes per station
const DEFAULT_TRANSFER_TIME = 6;  // minutes per transfer

/**
 * High-level metro route planner.
 *
 * Owns the graph state built from the static line data. Thin wrapper around
 * the pure graph/dijkstra/route modules for convenient reuse.
 */
export class MetroSystem {
  private readonly graph: ReturnType<typeof buildGraph>;

  constructor(options: MetroOptions = {}) {
    this.graph = buildGraph(
      lines,
      options.segmentTime ?? DEFAULT_SEGMENT_TIME,
      options.transferTime ?? DEFAULT_TRANSFER_TIME,
      new Set(options.circularLines ?? []),
    );
  }

  findBestRoute(start: string, dest: string): FindRouteResult {
    return findBestRoute(this.graph, start, dest);
  }

  formatRoute(result: RouteResult): string {
    return formatRoute(result);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node src/gzmetro.ts <departure> <destination>');
    console.error('Example: node src/gzmetro.ts "公园前" "广州南站"');
    process.exit(1);
  }

  const [start, dest] = args as [string, string];
  const metro = new MetroSystem();
  const result = metro.findBestRoute(start, dest);

  if ('error' in result) {
    console.error(`✗ ${result.error}`);
    process.exit(1);
  }

  console.log(metro.formatRoute(result));
}

// Run CLI only when invoked directly
if (process.argv[1] === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
