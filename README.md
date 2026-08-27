## Introduction
  用于广州地铁路线检索的简易实验性 CLI
  a simple experimental CLI for Guangzhou Metro

## Usage

```bash
# 同步并进入项目
git clone …
cd …

# 最短时间+最少转站 路线
node src/cli.ts "北山" "沙园"  # 北山 -> 沙园

# 列举包含指定内容的站点及其所属路线
node src/cli.ts station "北"

# 列举指定线路的站点
node src/cli.ts line "1"
```
