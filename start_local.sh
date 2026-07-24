#!/usr/bin/env bash
# Sobe o next start carregando o .env.local (server-side envs).
set -a
source "$(dirname "$0")/.env.local"
set +a
PORT="${PORT:-3017}" exec npx next start
