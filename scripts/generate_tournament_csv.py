#!/usr/bin/env python3
import argparse
import csv
import random
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from tournament_game_builder import Game, build_games, build_games_from_slots
from tournament_player_placement import RandomPlacementStrategy, SmartSeedPlacementStrategy


HEADER = [
    "id",
    "left_player_id",
    "right_player_id",
    "next_left_id",
    "next_right_id",
    "left_player_flag",
    "left_retire",
    "right_retire",
]

PLAYER_BASE_FIELDS = ["id", "group_id", "name", "name_kana", "mvp"]
RANK_SUFFIXES = ["rank_group", "rank_lastyear", "rank_total"]
COMMENT_SUFFIXES = ["comment"]
EVENT_PREFIXES_TO_STRIP = ("high_school_",)


def player_column_to_event_name(player_column):
    suffix = "_player_id"
    if not player_column.endswith(suffix):
        raise ValueError(f"player column must end with {suffix}: {player_column}")
    return player_column[: -len(suffix)]


def normalize_event_name(event_name):
    for prefix in EVENT_PREFIXES_TO_STRIP:
        if event_name.startswith(prefix):
            return event_name[len(prefix):]
    return event_name


def is_individual_player_column(field):
    return (
        field.endswith("_player_id")
        and not field.startswith("dantai_")
        and not field.startswith("group_")
    )


def clean_player_id(value):
    value = value.strip()
    return value if value.isdigit() else ""


def clean_integer(value):
    value = value.strip()
    return value if value.isdigit() else ""


def write_games(games, output):
    writer = csv.DictWriter(output, fieldnames=HEADER, lineterminator="\n")
    writer.writeheader()
    for game in games:
        writer.writerow(game.as_row())


def source_event_names(source_tables):
    event_counts = {}
    event_order = []
    for fieldnames, _ in source_tables:
        for field in fieldnames:
            if not is_individual_player_column(field):
                continue
            event_name = normalize_event_name(player_column_to_event_name(field))
            if event_name not in event_counts:
                event_order.append(event_name)
            event_counts.setdefault(event_name, 0)

    for _, rows in source_tables:
        for source_row in rows:
            for event_name in event_counts:
                source_event_name = source_event_name_for_output(source_row, event_name)
                player_id = clean_player_id(source_row.get(f"{source_event_name}_player_id", ""))
                if player_id:
                    event_counts[event_name] += 1

    return [
        event_name
        for event_name in event_order
        if event_counts[event_name] >= 2
    ]


def source_output_fieldnames(event_names):
    fieldnames = PLAYER_BASE_FIELDS[:]
    for event_name in event_names:
        fieldnames.append(f"{event_name}_player_id")
        for suffix in RANK_SUFFIXES:
            fieldnames.append(f"{event_name}_{suffix}")
        for suffix in COMMENT_SUFFIXES:
            fieldnames.append(f"{event_name}_{suffix}")
    return fieldnames


def build_players_rows_from_sources(source_tables, event_names):
    output_rows = []
    output_id = 1
    for _, rows in source_tables:
        for source_row in rows:
            output_row = {field: "" for field in source_output_fieldnames(event_names)}
            output_row["id"] = str(output_id)
            output_id += 1
            for field in PLAYER_BASE_FIELDS:
                if field == "id":
                    continue
                output_row[field] = source_row.get(field, "").strip()

            for event_name in event_names:
                source_event_name = source_event_name_for_output(source_row, event_name)
                output_row[f"{event_name}_player_id"] = clean_player_id(
                    source_row.get(f"{source_event_name}_player_id", "")
                )
                for suffix in RANK_SUFFIXES:
                    output_row[f"{event_name}_{suffix}"] = source_row.get(
                        f"{source_event_name}_{suffix}",
                        "",
                    )
                    output_row[f"{event_name}_{suffix}"] = clean_integer(
                        output_row[f"{event_name}_{suffix}"]
                    )
                for suffix in COMMENT_SUFFIXES:
                    output_row[f"{event_name}_{suffix}"] = source_row.get(
                        f"{source_event_name}_{suffix}",
                        "",
                    ).strip()

            output_rows.append(output_row)
    return output_rows


def source_event_name_for_output(source_row, output_event_name):
    for prefix in ("", *EVENT_PREFIXES_TO_STRIP):
        source_event_name = f"{prefix}{output_event_name}"
        if f"{source_event_name}_player_id" in source_row:
            return source_event_name
    return output_event_name


def write_players_csv(fieldnames, rows, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def players_column_sql(field):
    if field == "id":
        return "id integer not null"
    if field == "group_id":
        return "group_id integer not null"
    if field in ("name", "name_kana"):
        return f"{field} text not null"
    if field == "mvp":
        return "mvp integer"
    if field.endswith("_player_id"):
        return f"{field} integer unique"
    if field.endswith("_comment"):
        return f"{field} text"
    return f"{field} integer"


def write_static_generate_tables_sql(fieldnames, path):
    lines = [
        "create table groups",
        "(id integer not null,",
        "name text not null,",
        "primary key(id));",
        "",
        "create table event_type",
        "(id integer not null,",
        " name text not null,",
        " name_en text not null,",
        " order_id integer not null,",
        " existence integer not null,",
        " full_name text not null,",
        " description text not null,",
        " early_round_type text not null,",
        " later_round_type text not null,",
        " primary key(id));",
        "",
        "create table court_type",
        "(id integer not null,",
        " name text not null,",
        " primary key(id));",
        "",
        "create table players",
        "(",
    ]
    lines.extend(f"{players_column_sql(field)}," for field in fieldnames)
    lines.extend(
        [
            "primary key(id),",
            "foreign key (group_id) references groups(id));",
            "",
            "create table notification_request",
            "(id serial not null,",
            " event_id integer not null,",
            " player_id integer unique,",
            " group_id integer,",
            " group_name text,",
            " court_id integer not null,",
            " primary key(id),",
            " foreign key (event_id) references event_type(id),",
            " foreign key (player_id) references players(id),",
            " foreign key (court_id) references court_type(id));",
            "",
            "\\copy groups from 'groups.csv' csv header;",
            "\\copy event_type from 'event_type.csv' csv header;",
            "\\copy court_type from 'court_type.csv' csv header;",
            "\\copy players from 'players.csv' csv header;",
        ]
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_original_generate_tables_sql(event_names, path):
    lines = []
    for event_name in event_names:
        lines.extend(
            [
                f"create table {event_name}",
                "(id integer not null,",
                "left_player_id integer,",
                "right_player_id integer,",
                "next_left_id integer,",
                "next_right_id integer,",
                "left_player_flag integer,",
                "left_retire integer,",
                "right_retire integer,",
                f"foreign key (left_player_id) references players({event_name}_player_id),",
                f"foreign key (right_player_id) references players({event_name}_player_id),",
                "primary key(id));",
                "",
            ]
        )
    for event_name in event_names:
        lines.append(f"\\copy {event_name} from '{event_name}.csv' csv header;")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def player_ids_from_rows(rows, player_column):
    return [
        clean_player_id(row.get(player_column, ""))
        for row in rows
        if clean_player_id(row.get(player_column, ""))
    ]


def placement_players_from_rows(rows, event_name):
    player_column = f"{event_name}_player_id"
    return [
        {
            "player_id": clean_player_id(row.get(player_column, "")),
            "group_id": clean_integer(row.get("group_id", "")),
            "rank_group": clean_integer(row.get(f"{event_name}_rank_group", "")),
            "rank_lastyear": clean_integer(row.get(f"{event_name}_rank_lastyear", "")),
            "rank_total": clean_integer(row.get(f"{event_name}_rank_total", "")),
        }
        for row in rows
        if clean_player_id(row.get(player_column, ""))
    ]


def create_placement_strategy(args, rng):
    if args.placement == "random":
        return RandomPlacementStrategy(rng)
    return SmartSeedPlacementStrategy(
        rng,
        seed=args.seed,
        max_attempts=args.placement_attempts,
        max_search_nodes=args.placement_search_nodes,
    )


def generate_from_source_csvs(args):
    source_tables = [read_players_table(path) for path in args.source_csv]
    event_names = source_event_names(source_tables)
    output_fieldnames = source_output_fieldnames(event_names)
    output_rows = build_players_rows_from_sources(source_tables, event_names)

    players_csv = args.players_csv or Path("data") / args.competition / "static" / "players.csv"
    write_players_csv(output_fieldnames, output_rows, players_csv)
    print(f"wrote {players_csv} ({len(output_rows)} players)")
    static_sql = players_csv.parent / "generate_tables.sql"
    write_static_generate_tables_sql(output_fieldnames, static_sql)
    print(f"wrote {static_sql}")

    rng = random.Random(args.seed)
    random_placement_strategy = RandomPlacementStrategy(rng)
    generated_event_names = []
    for event_name in event_names:
        players = placement_players_from_rows(output_rows, event_name)
        if len(players) < 2:
            print(f"skipped {event_name} ({len(players)} players)", file=sys.stderr)
            continue

        placement_strategy = (
            random_placement_strategy
            if args.placement == "random"
            else SmartSeedPlacementStrategy(
                random.Random(args.seed),
                seed=args.seed,
                max_attempts=args.placement_attempts,
                max_search_nodes=args.placement_search_nodes,
            )
        )
        try:
            slot_players = placement_strategy.build_slot_players(players)
        except ValueError as e:
            raise ValueError(f"{event_name}: {e}") from e
        games = build_games_from_slots(slot_players)
        output_csv = Path("data") / args.competition / "original" / f"{event_name}.csv"

        output_csv.parent.mkdir(parents=True, exist_ok=True)
        with output_csv.open("w", encoding="utf-8", newline="") as f:
            write_games(games, f)
        print(f"wrote {output_csv} ({len(players)} players, {len(games)} rows)")
        generated_event_names.append(event_name)

    original_sql = Path("data") / args.competition / "original" / "generate_tables.sql"
    write_original_generate_tables_sql(generated_event_names, original_sql)
    print(f"wrote {original_sql}")


def read_players_table(players_csv):
    with players_csv.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        try:
            fieldnames = next(reader)
        except StopIteration:
            raise ValueError(f"{players_csv} is empty")
        raw_rows = list(reader)

    rows = []
    for row_number, row in enumerate(raw_rows, start=2):
        if len(row) != len(fieldnames):
            raise ValueError(
                f"{players_csv}:{row_number} has {len(row)} columns, expected {len(fieldnames)}"
            )
        rows.append(dict(zip(fieldnames, row)))
    return fieldnames, rows


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate players.csv and individual tournament CSVs from source player CSVs."
    )
    parser.add_argument("competition", help="competition name under data/, e.g. 2025_kid")
    parser.add_argument(
        "--source-csv",
        type=Path,
        nargs="+",
        required=True,
        help="build static/players.csv and all individual tournaments from one or more source CSVs",
    )
    parser.add_argument("--players-csv", type=Path, help="override players.csv path")
    parser.add_argument(
        "--placement",
        choices=("smart", "random"),
        default="smart",
        help="player placement strategy (default: smart)",
    )
    parser.add_argument("--seed", type=int, help="random seed for reproducible shuffling")
    parser.add_argument(
        "--placement-attempts",
        type=int,
        default=100,
        help="max smart placement attempts with derived random seeds",
    )
    parser.add_argument(
        "--placement-search-nodes",
        type=int,
        default=1000,
        help="max backtracking nodes per smart placement attempt",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    generate_from_source_csvs(args)


if __name__ == "__main__":
    main()
