#!/usr/bin/env bash
# 依存: curl のみ。Cloudflare の速度計測エンドポイントを使う。
# 使い方: ./speedtest.sh [下りMB] [上りMB]   例: ./speedtest.sh 50 10
set -euo pipefail

DL_MB=${1:-50}
UL_MB=${2:-10}
DL_BYTES=$((DL_MB * 1000 * 1000))
UL_BYTES=$((UL_MB * 1000 * 1000))
BASE="https://speed.cloudflare.com"

mbps() { awk -v b="$1" 'BEGIN{ printf "%.2f", b*8/1000000 }'; }
ms()   { awk -v s="$1" 'BEGIN{ printf "%.1f", s*1000 }'; }

echo "=== インターネット速度計測 ($(date '+%F %T')) ==="

# --- レイテンシ: 1バイトだけ取って TTFB を3回測り最小値を採用 ---
best=""
for _ in 1 2 3; do
  t=$(curl -sS -o /dev/null -w '%{time_starttransfer}' "$BASE/__down?bytes=1")
  if [[ -z "$best" ]] || awk -v a="$t" -v b="$best" 'BEGIN{exit !(a<b)}'; then best=$t; fi
done
echo "レイテンシ : $(ms "$best") ms"

# --- 下り ---
dl=$(curl -sS -o /dev/null -w '%{speed_download}' "$BASE/__down?bytes=$DL_BYTES")
echo "下り       : $(mbps "$dl") Mbps  (${DL_MB}MB)"

# --- 上り ---
ul=$(head -c "$UL_BYTES" /dev/zero | curl -sS -o /dev/null -w '%{speed_upload}' \
      -X POST -H 'Content-Type: application/octet-stream' \
      --data-binary @- "$BASE/__up")
echo "上り       : $(mbps "$ul") Mbps  (${UL_MB}MB)"