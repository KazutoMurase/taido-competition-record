#!/usr/bin/env python3
"""Generate the existing competition CSV format with CP-SAT placement."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import random
import shutil
import sys
import tempfile

import ortools

from placement import optimize

# Share CSV parsing, team reconstruction, SQL schemas and game numbering with
# the existing generator; its CLI and placement algorithms remain unchanged.
sys.dont_write_bytecode = True
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR.parent))
import generate_tournament_csv as legacy  # noqa: E402


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("competition", help="competition directory name under data/")
    parser.add_argument("--source-csv", type=Path, nargs="+", required=True)
    parser.add_argument(
        "--backup",
        action="store_true",
        help="back up replaced output files (default: no backup)",
    )
    parser.add_argument(
        "--seed", type=int, help="random seed (generated and recorded if omitted)"
    )
    parser.add_argument(
        "--time-limit",
        type=float,
        default=60.0,
        help="seconds per optimization stage (default: 60)",
    )
    parser.add_argument(
        "--hierarchical",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="spread top 8, 16, ... across regions (default: enabled)",
    )
    args = parser.parse_args(argv)
    if (
        not args.competition
        or args.competition in (".", "..")
        or Path(args.competition).name != args.competition
        or "\\" in args.competition
    ):
        parser.error("competition must be a single directory name under data/")
    if not math.isfinite(args.time_limit) or args.time_limit <= 0:
        parser.error("--time-limit must be a finite positive number")
    if args.seed is None:
        args.seed = random.SystemRandom().randrange(2**31 - 1)
    return args


def publish(staging, destination, *, backup_existing=False):
    """Publish completed output, optionally backing up replaced files first."""
    files = sorted(path for path in staging.rglob("*") if path.is_file())
    changed = [
        path
        for path in files
        if not (destination / path.relative_to(staging)).exists()
        or path.read_bytes() != (destination / path.relative_to(staging)).read_bytes()
    ]
    existing = [
        path for path in changed if (destination / path.relative_to(staging)).exists()
    ]
    backup = None
    if backup_existing and existing:
        backup = (
            destination
            / "generation_backups"
            / datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
        )
        for path in existing:
            relative = path.relative_to(staging)
            target = backup / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(destination / relative, target)
        print(f"backed up {len(existing)} files to {backup}", flush=True)
    for path in changed:
        target = destination / path.relative_to(staging)
        target.parent.mkdir(parents=True, exist_ok=True)
        # staging and destination share a filesystem: each replacement is atomic.
        path.replace(target)
        print(f"wrote {target}", flush=True)
    return backup


def generate(args, *, data_root=Path("data")):
    destination = data_root / args.competition
    sources = [path.expanduser() for path in args.source_csv]
    source_tables = [legacy.read_players_table(path) for path in sources]
    events = legacy.source_event_names(source_tables)
    fields = legacy.source_output_fieldnames(events)
    rows = legacy.build_players_rows_from_sources(source_tables, events)
    teams = legacy.extract_group_event_teams(
        source_tables,
        legacy.read_group_names(destination / "static" / "groups.csv"),
        legacy.source_group_event_names(source_tables),
    )
    if not events and not teams:
        raise ValueError("no event with at least two participants/teams was found")
    report = {
        "algorithm": "lexicographic_cp_sat",
        "ortools_version": ortools.__version__,
        "seed": args.seed,
        "global_rank_field": "rank_total",
        "hierarchical": args.hierarchical,
        "sources": [
            {"name": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
            for path in sources
        ],
        "events": {},
    }
    print(f"seed={args.seed}; output={destination}", flush=True)
    data_root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix=".or-tournament-", dir=data_root
    ) as directory:
        staging = Path(directory)
        legacy.write_players_csv(fields, rows, staging / "static" / "players.csv")
        legacy.write_static_generate_tables_sql(
            fields, staging / "static" / "generate_tables.sql"
        )

        def tournament(event, players, group=False):
            def progress(message):
                print(f"[{event}] {message}", file=sys.stderr, flush=True)

            try:
                result = optimize(
                    players,
                    seed=args.seed,
                    time_limit=args.time_limit,
                    hierarchical=args.hierarchical,
                    progress=progress,
                )
            except ValueError as exc:
                raise ValueError(f"{event}: {exc}") from exc
            games = legacy.build_games_from_slots(result.slots)
            path = staging / "original" / f"{event}.csv"
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("w", encoding="utf-8", newline="") as output:
                (legacy.write_group_games if group else legacy.write_games)(
                    games, output
                )
            report["events"][event] = result.report

        for event in events:
            tournament(event, legacy.placement_players_from_rows(rows, event))
        group_rng = random.Random(args.seed)
        for event, event_teams in teams.items():
            legacy.write_group_teams_csv(
                event_teams, staging / "original" / f"{event}_groups.csv"
            )
            if legacy.is_group_tournament_event(event):
                tournament(
                    event, legacy.group_placement_players(event_teams), group=True
                )
            else:
                team_ids = [team["id"] for team in event_teams]
                group_rng.shuffle(team_ids)
                legacy.write_group_table_csv(
                    event, team_ids, staging / "original" / f"{event}.csv"
                )
                report["events"][event] = {
                    "algorithm": "legacy_table_shuffle",
                    "team_count": len(team_ids),
                }
        legacy.write_original_generate_tables_sql(
            events, staging / "original" / "generate_tables.sql", list(teams)
        )
        (staging / "generation_report.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        # Nothing in the destination is changed unless every event succeeded.
        publish(staging, destination, backup_existing=args.backup)
    return report


def main():
    args = parse_args()
    try:
        generate(args)
    except (ValueError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
