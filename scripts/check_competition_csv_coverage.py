#!/usr/bin/env python3
import argparse
import csv
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path


BLOCK_NAMES = tuple("abcdef")
FINISHED_EVENT_ID = "0"


@dataclass(frozen=True)
class Issue:
    level: str
    message: str


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def clean(value):
    return value.strip().strip("'\"")


def as_int(value, path, field):
    value = clean(value)
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        raise ValueError(f"{path}: {field} must be an integer, got {value!r}")


def numeric_values(rows, field):
    values = []
    for row in rows:
        value = clean(row.get(field, ""))
        if value:
            values.append(value)
    return values


def check_consecutive_ids(label, rows, issues, level="ERROR"):
    ids = numeric_values(rows, "id")
    counter = Counter(ids)
    duplicates = sorted(value for value, count in counter.items() if count > 1)
    if duplicates:
        issues.append(Issue(level, f"{label}: duplicate id(s): {', '.join(duplicates)}"))
        return
    if not ids:
        issues.append(Issue(level, f"{label}: no id rows"))
        return

    int_ids = sorted(int(value) for value in ids)
    expected = list(range(1, int_ids[-1] + 1))
    if int_ids != expected:
        missing = sorted(set(expected) - set(int_ids))
        extra = sorted(set(int_ids) - set(expected))
        detail = []
        if missing:
            detail.append(f"missing {format_ranges(missing)}")
        if extra:
            detail.append(f"extra {format_ranges(extra)}")
        issues.append(Issue(level, f"{label}: id is not consecutive 1..{int_ids[-1]} ({'; '.join(detail)})"))


def format_ranges(values):
    values = sorted(values)
    ranges = []
    start = prev = values[0]
    for value in values[1:]:
        if value == prev + 1:
            prev = value
            continue
        ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
        start = prev = value
    ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
    return ", ".join(ranges)


def event_kind(rows):
    if not rows:
        return "unknown"
    fields = rows[0].keys()
    if "left_player_id" in fields:
        return "individual_tournament"
    if "left_group_id" in fields:
        return "group_tournament"
    if "group_id" in fields and "round" in fields:
        return "group_table"
    return "unknown"


def expected_participant_ids(players_rows, event_name):
    return set(numeric_values(players_rows, f"{event_name}_player_id"))


def actual_tournament_participant_ids(rows, left_field, right_field):
    return set(numeric_values(rows, left_field)) | set(numeric_values(rows, right_field))


def check_participants(base_dir, event_name, kind, event_rows, players_rows, issues, strict_entrants=False):
    entrant_level = "ERROR" if strict_entrants else "WARN"
    if kind == "individual_tournament":
        expected = expected_participant_ids(players_rows, event_name)
        actual = actual_tournament_participant_ids(event_rows, "left_player_id", "right_player_id")
        compare_sets(f"{event_name}: participants", expected, actual, issues, entrant_level)
        return

    if kind == "group_tournament":
        groups_path = base_dir / "original" / f"{event_name}_groups.csv"
        if not groups_path.exists():
            issues.append(Issue("ERROR", f"{event_name}: missing groups file {groups_path}"))
            return
        group_rows = read_csv(groups_path)
        check_consecutive_ids(str(groups_path), group_rows, issues)
        expected = set(numeric_values(group_rows, "id"))
        actual = actual_tournament_participant_ids(event_rows, "left_group_id", "right_group_id")
        compare_sets(f"{event_name}: group tournament entrants", expected, actual, issues, entrant_level)
        return

    if kind == "group_table":
        groups_path = base_dir / "original" / f"{event_name}_groups.csv"
        if not groups_path.exists():
            issues.append(Issue("ERROR", f"{event_name}: missing groups file {groups_path}"))
            return
        group_rows = read_csv(groups_path)
        check_consecutive_ids(str(groups_path), group_rows, issues)
        expected = set(numeric_values(group_rows, "id"))
        final_round = max_round(event_rows)
        actual = set(
            clean(row.get("group_id", ""))
            for row in event_rows
            if clean(row.get("group_id", ""))
            and (final_round <= 1 or as_int(row.get("round", ""), event_name, "round") != final_round)
        )
        compare_sets(f"{event_name}: group table entrants before final round", expected, actual, issues, entrant_level)


def compare_sets(label, expected, actual, issues, level="ERROR"):
    missing = sorted(expected - actual, key=int)
    extra = sorted(actual - expected, key=int)
    if missing:
        issues.append(Issue(level, f"{label}: missing {format_ranges([int(v) for v in missing])}"))
    if extra:
        issues.append(Issue(level, f"{label}: unexpected {format_ranges([int(v) for v in extra])}"))


def max_round(rows):
    rounds = [int(clean(row["round"])) for row in rows if clean(row.get("round", ""))]
    return max(rounds) if rounds else 0


def round_for_id(rows):
    return {
        clean(row["id"]): int(clean(row["round"]))
        for row in rows
        if clean(row.get("id", "")) and clean(row.get("round", ""))
    }


def event_expected_ids(rows):
    return set(numeric_values(rows, "id"))


def load_events(base_dir):
    rows = read_csv(base_dir / "static" / "event_type.csv")
    events = {}
    for row in rows:
        event_id = clean(row["id"])
        events[event_id] = {
            "name": clean(row["name"]),
            "name_en": clean(row["name_en"]),
            "existence": clean(row["existence"]),
        }
    return events


def load_event_csvs(base_dir, events, issues):
    loaded = {}
    for event_id, meta in events.items():
        if event_id == FINISHED_EVENT_ID:
            continue
        path = base_dir / "original" / f"{meta['name_en']}.csv"
        if not path.exists():
            if meta["existence"] not in {"0", ""}:
                issues.append(Issue("ERROR", f"event_id={event_id} {meta['name_en']}: missing {path}"))
            continue
        rows = read_csv(path)
        check_consecutive_ids(str(path), rows, issues)
        loaded[event_id] = {
            **meta,
            "path": path,
            "rows": rows,
            "kind": event_kind(rows),
            "expected_ids": event_expected_ids(rows),
        }
    return loaded


def load_schedule_entries(base_dir, events, event_csvs, issues):
    entries_by_event = defaultdict(list)

    for block in BLOCK_NAMES:
        block_path = base_dir / "original" / f"block_{block}.csv"
        games_path = base_dir / "original" / f"block_{block}_games.csv"
        if not block_path.exists() and not games_path.exists():
            continue
        if not block_path.exists() or not games_path.exists():
            issues.append(Issue("ERROR", f"block_{block}: missing one of {block_path.name} / {games_path.name}"))
            continue

        schedules = read_csv(block_path)
        games = read_csv(games_path)
        check_consecutive_ids(str(block_path), schedules, issues)
        check_consecutive_ids(str(games_path), games, issues, level="WARN")

        schedules_by_id = {}
        for row in schedules:
            schedule_id = clean(row["id"])
            event_id = clean(row["event_id"])
            schedules_by_id[schedule_id] = row
            if event_id != FINISHED_EVENT_ID and event_id not in events:
                issues.append(Issue("ERROR", f"{block_path}: schedule_id={schedule_id} unknown event_id={event_id}"))
            if event_id != FINISHED_EVENT_ID and event_id not in event_csvs:
                event_name = events.get(event_id, {}).get("name_en", "?")
                issues.append(Issue("ERROR", f"{block_path}: schedule_id={schedule_id} event {event_id}/{event_name} has no event CSV"))

        order_by_schedule = defaultdict(list)
        for game_row in games:
            schedule_id = clean(game_row["schedule_id"])
            if schedule_id not in schedules_by_id:
                issues.append(Issue("ERROR", f"{games_path}: id={clean(game_row['id'])} unknown schedule_id={schedule_id}"))
                continue
            schedule = schedules_by_id[schedule_id]
            event_id = clean(schedule["event_id"])
            order_by_schedule[schedule_id].append(as_int(game_row["order_id"], games_path, "order_id"))
            if event_id == FINISHED_EVENT_ID or event_id not in event_csvs:
                continue
            entries_by_event[event_id].append(
                {
                    "block": block,
                    "schedule_id": schedule_id,
                    "order_id": clean(game_row["order_id"]),
                    "game_id": clean(game_row["game_id"]),
                    "before_final": clean(schedule["before_final"]) == "1",
                    "final": clean(schedule["final"]) == "1",
                    "time_schedule": clean(schedule["time_schedule"]),
                }
            )

        for schedule_id, order_ids in order_by_schedule.items():
            if not order_ids:
                continue
            expected = list(range(1, max(order_ids) + 1))
            if sorted(order_ids) != expected:
                issues.append(
                    Issue(
                        "ERROR",
                        f"{games_path}: schedule_id={schedule_id} order_id is not consecutive 1..{max(order_ids)}",
                    )
                )

    return entries_by_event


def check_schedule_coverage(event_csvs, entries_by_event, issues):
    for event_id, event in sorted(event_csvs.items(), key=lambda item: int(item[0])):
        event_name = event["name_en"]
        entries = entries_by_event.get(event_id, [])
        scheduled_ids = [entry["game_id"] for entry in entries]
        expected = event["expected_ids"]
        actual = set(scheduled_ids)
        counter = Counter(scheduled_ids)

        missing = sorted(expected - actual, key=int)
        extra = sorted(actual - expected, key=int)
        duplicates = sorted(value for value, count in counter.items() if count > 1)

        if missing:
            issues.append(Issue("ERROR", f"{event_name}: unscheduled game id(s): {format_ranges([int(v) for v in missing])}"))
        if extra:
            issues.append(Issue("ERROR", f"{event_name}: scheduled unknown game id(s): {format_ranges([int(v) for v in extra])}"))
        if duplicates:
            detail = ", ".join(f"{value}x{counter[value]}" for value in duplicates)
            issues.append(Issue("ERROR", f"{event_name}: duplicate scheduled game id(s): {detail}"))

        check_final_flags(event_name, event, entries, issues)


def check_final_flags(event_name, event, entries, issues):
    if not event["expected_ids"]:
        return

    if event["kind"] in {"individual_tournament", "group_tournament"}:
        final_id = str(max(int(value) for value in event["expected_ids"]))
        third_place_id = str(max(1, int(final_id) - 1))
        for entry in entries:
            game_id = entry["game_id"]
            label = f"{event_name}: block_{entry['block']} schedule_id={entry['schedule_id']} game_id={game_id}"

            if entry["final"] and entry["before_final"]:
                if game_id not in {third_place_id, final_id}:
                    issues.append(
                        Issue(
                            "ERROR",
                            f"{label}: combined before_final/final schedule should contain only game_id={third_place_id},{final_id}",
                        )
                    )
                continue

            if entry["final"] and game_id != final_id:
                issues.append(Issue("ERROR", f"{label}: final schedule should contain only final game_id={final_id}"))
            elif entry["before_final"] and game_id != third_place_id:
                issues.append(Issue("ERROR", f"{label}: before_final schedule should contain only third-place game_id={third_place_id}"))
            elif not entry["final"] and game_id == final_id:
                issues.append(Issue("ERROR", f"{label}: final game is scheduled without final=1"))
            elif not entry["before_final"] and game_id == third_place_id:
                issues.append(Issue("ERROR", f"{label}: third-place game is scheduled without before_final=1"))
        return

    if event["kind"] == "group_table":
        rounds = round_for_id(event["rows"])
        final_round = max(rounds.values()) if rounds else 0
        if final_round <= 1:
            return
        for entry in entries:
            game_id = entry["game_id"]
            row_round = rounds.get(game_id)
            if row_round is None:
                continue
            label = f"{event_name}: block_{entry['block']} schedule_id={entry['schedule_id']} game_id={game_id}"
            if entry["final"] and row_round != final_round:
                issues.append(Issue("ERROR", f"{label}: final schedule should contain only round={final_round}, got round={row_round}"))
            if not entry["final"] and row_round == final_round:
                issues.append(Issue("ERROR", f"{label}: final round is scheduled without final=1"))
            if entry["before_final"]:
                issues.append(Issue("ERROR", f"{label}: group table event should not use before_final=1"))


def print_summary(event_csvs, entries_by_event):
    print("Coverage summary")
    for event_id, event in sorted(event_csvs.items(), key=lambda item: int(item[0])):
        entries = entries_by_event.get(event_id, [])
        ids = sorted((int(entry["game_id"]) for entry in entries), key=int)
        if ids:
            scheduled = format_ranges(ids)
        else:
            scheduled = "(none)"
        print(
            f"- {event_id:>2} {event['name_en']:<30} "
            f"{event['kind']:<22} expected=1-{max(int(v) for v in event['expected_ids'])} scheduled={scheduled}"
        )

        by_schedule = defaultdict(list)
        for entry in entries:
            flags = []
            if entry["before_final"]:
                flags.append("before_final")
            if entry["final"]:
                flags.append("final")
            key = (entry["block"], entry["schedule_id"], entry["time_schedule"], "+".join(flags) or "normal")
            by_schedule[key].append(int(entry["game_id"]))
        for (block, schedule_id, time_schedule, flags), game_ids in sorted(by_schedule.items()):
            print(
                f"    block_{block} schedule={schedule_id:<2} {time_schedule:<13} "
                f"{flags:<12} game_id={format_ranges(game_ids)}"
            )


def parse_args():
    parser = argparse.ArgumentParser(
        description="Check event CSV and block schedule game coverage for a competition."
    )
    parser.add_argument("competition", help="competition name under data/, e.g. 2026_kid")
    parser.add_argument("--base", type=Path, default=Path("data"), help="base data directory")
    parser.add_argument(
        "--strict-entrants",
        action="store_true",
        help="treat players.csv / *_groups.csv entrant mismatches as errors instead of warnings",
    )
    parser.add_argument("--verbose", action="store_true", help="print per-event schedule coverage")
    return parser.parse_args()


def main():
    args = parse_args()
    base_dir = args.base / args.competition
    issues = []

    try:
        events = load_events(base_dir)
        players_rows = read_csv(base_dir / "static" / "players.csv")
        event_csvs = load_event_csvs(base_dir, events, issues)
        for event in event_csvs.values():
            check_participants(
                base_dir,
                event["name_en"],
                event["kind"],
                event["rows"],
                players_rows,
                issues,
                strict_entrants=args.strict_entrants,
            )
        entries_by_event = load_schedule_entries(base_dir, events, event_csvs, issues)
        check_schedule_coverage(event_csvs, entries_by_event, issues)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    if args.verbose:
        print_summary(event_csvs, entries_by_event)
        print()

    if issues:
        for issue in issues:
            print(f"{issue.level}: {issue.message}", file=sys.stderr)
        if any(issue.level == "ERROR" for issue in issues):
            return 1
        print(
            f"OK: {args.competition} event CSVs and block schedules cover all game ids without duplicates "
            f"({len(issues)} warning(s))."
        )
        return 0

    print(f"OK: {args.competition} event CSVs and block schedules cover all game ids without duplicates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
