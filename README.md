## Introduction

  用于广州地铁路线检索的简易实验性 CLI，供个人使用。

  A simple experimental CLI for Guangzhou Metro.

## Requirements

- 任何常见 CLI 环境
- Node.js ≥ 22.18.0

## Usage

```bash
# 同步并进入项目
git clone …
cd …

# 给出最短时间路线
node src/cli.ts "北山" "沙园"  # 北山 -> 沙园；只展示最少转站路线
node src/cli.ts --show-all "北山" "沙园"  # 展示所有路线

# 列举包含指定内容的站点及其所属路线
node src/cli.ts station "北"

# 列举指定线路的站点
node src/cli.ts line "1"
```
