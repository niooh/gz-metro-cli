import { fileURLToPath } from 'node:url';
import path from 'node:path';

import type { MetroOptions } from './types.ts';
import { lines } from './lines.ts';
import { buildGraph } from './graph.ts';
import { findAllBestRoutes } from './dijkstra.ts';
import { formatRoute } from './route.ts';
import { yellow, blue, gray, bold } from './colors.ts';


const DEFAULT_SEGMENT_TIME = 2.5;
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

  /** 查找站名中包含指定内容的所有站点及其所属线路。 */
  listStationsContaining(query: string) {
    const results: { station: string; lines: string[] }[] = [];
    for (const [station, lineSet] of this.graph.linesByStation) {
      if (station.includes(query)) {
        results.push({ station, lines: [...lineSet].sort() });
      }
    }
    return results.sort((a, b) => a.station.localeCompare(b.station, 'zh-CN'));
  }

  /** 按线路名称精确匹配，返回该线所有站点。 */
  getLineStations(lineName: string): string[] | undefined {
    return this.graph.stationsByLine.get(lineName);
  }
}

function printStationSearch(query: string, metro: MetroSystem): void {
  const results = metro.listStationsContaining(query);
  if (results.length === 0) {
    console.log(`No stations containing "${bold(query)}".`);
    return;
  }
  console.log(`Stations containing "${bold(query)}":`);
  for (const { station, lines: lineList } of results) {
    console.log(`  ${blue(station)}: ${lineList.join(', ')}`);
  }
}

function printLine(lineName: string, metro: MetroSystem): void {
  const stations = metro.getLineStations(lineName);
  if (!stations || stations.length === 0) {
    console.log(`Line "${lineName}" not found.`);
    return;
  }
  console.log(yellow(`Line ${lineName}:`));
  console.log(stations.join(` ${gray('->')} `));
}

function main(): void {
  const args = process.argv.slice(2);

  // 子命令：station
  if (args[0] === 'station') {
    if (args.length < 2) {
      console.error('Usage: node cli.ts station <query>');
      console.error('Example: node cli.ts station "广州"');
      process.exit(1);
    }
    const metro = new MetroSystem();
    printStationSearch(args[1], metro);
    return;
  }

  // 子命令：line
  if (args[0] === 'line') {
    if (args.length < 2) {
      console.error('Usage: node cli.ts line <line>');
      console.error('Example: node cli.ts line "1"');
      process.exit(1);
    }
    const metro = new MetroSystem();
    printLine(args[1], metro);
    return;
  }

  // 原路线查询
  const showAllIndex = args.indexOf('--show-all');
  const showAll = showAllIndex !== -1;
  if (showAll) {
    args.splice(showAllIndex, 1);
  }

  if (args.length < 2) {
    console.error('Usage: node cli.ts [--show-all] <departure> <destination>');
    console.error('       node cli.ts station <query>');
    console.error('       node cli.ts line <line>');
    console.error('Examples:');
    console.error('  node cli.ts "公园前" "广州南站"');
    console.error('  node cli.ts --show-all "公园前" "广州南站"');
    console.error('  node cli.ts station "广州"');
    console.error('  node cli.ts line "1"');
    process.exit(1);
  }

  const [start, dest] = args as [string, string];
  const metro = new MetroSystem();
  const result = metro.findAllBestRoutes(start, dest);

  if ('error' in result) {
    console.error(`✗ ${result.error}`);
    return;
  }

  if (showAll) {
    console.log(`Found ${result.routes.length} route(s) with the same minimum time:\n`);
    result.routes.forEach((route, i) => {
      console.log(`- ${blue(`Route ${i + 1}`)}`);
      console.log(formatRoute(route));
      console.log();
    });
  } else {
    const bestRoute = result.routes[0]!;
    console.log(formatRoute(bestRoute));
  }
}

if (process.argv[1] === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
