import { fileURLToPath } from 'node:url';
import path from 'node:path';

import type { MetroOptions } from './types.ts';
import { lines } from './lines.ts';
import { buildGraph } from './graph.ts';
import { findAllBestRoutes } from './dijkstra.ts';
import { formatRoute } from './route.ts';

const DEFAULT_SEGMENT_TIME = 2;
const DEFAULT_TRANSFER_TIME = 6;

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

  findAllBestRoutes(start: string, dest: string) {
    return findAllBestRoutes(this.graph, start, dest);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const showAllIndex = args.indexOf('--show-all');
  const showAll = showAllIndex !== -1;
  if (showAll) {
    args.splice(showAllIndex, 1);
  }

  if (args.length < 2) {
    console.error('Usage: node src/gzmetro.ts [--show-all] <departure> <destination>');
    console.error('Example: node src/gzmetro.ts "公园前" "广州南站"');
    console.error('         node src/gzmetro.ts --show-all "公园前" "广州南站"');
    process.exit(1);
  }

  const [start, dest] = args as [string, string];
  const metro = new MetroSystem();
  const result = metro.findAllBestRoutes(start, dest);

  if ('error' in result) {
    console.error(`✗ ${result.error}`);
    process.exit(1);
  }

  if (showAll) {
    console.log(`Found ${result.routes.length} route(s) with the same minimum time:\n`);
    result.routes.forEach((route, i) => {
      console.log(`- Route ${i + 1} (transfers: ${route.transferCount})`);
      console.log(formatRoute(route));
      console.log();
    });
  } else {
    // Default: print the route with the fewest transfers among shortest-time routes
    const bestRoute = result.routes[0]!;
    console.log(formatRoute(bestRoute));
  }
}

// Run CLI only when invoked directly
if (process.argv[1] === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
