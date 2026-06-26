#!/usr/bin/env python3
import argparse
import csv
import random
import sys
from dataclasses import dataclass
from pathlib import Path


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


@dataclass
class Game:
    id: int
    left_player_id: str = ""
    right_player_id: str = ""
    next_left_id: str = ""
    next_right_id: str = ""

    def as_row(self):
        return {
            "id": self.id,
            "left_player_id": self.left_player_id,
            "right_player_id": self.right_player_id,
            "next_left_id": self.next_left_id,
            "next_right_id": self.next_right_id,
            "left_player_flag": "",
            "left_retire": "",
            "right_retire": "",
        }


@dataclass
class Node:
    path: str
    player_id: str = ""
    left: object = None
    right: object = None
    game_id: int = 0


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


def next_power_of_two(value):
    return 1 << (value - 1).bit_length()


def visual_seed_order(slot_count):
    if slot_count == 1:
        return [1]

    order = []
    for index, seed in enumerate(visual_seed_order(slot_count // 2)):
        complement = slot_count + 1 - seed
        if index % 2 == 0:
            order.extend([seed, complement])
        else:
            order.extend([complement, seed])
    return order


def seed_order(slot_count):
    visual_order = visual_seed_order(slot_count)
    middle = slot_count // 2
    return visual_order[:middle] + list(reversed(visual_order[middle:]))


def visual_path_key(path):
    if not path:
        return ""
    if path[0] == "L":
        return "0" + path[1:]
    return "1" + path[1:].translate(str.maketrans("LR", "RL"))


def node_state(node):
    return (
        "P" if node.left.player_id else "G",
        "P" if node.right.player_id else "G",
    )


def game_order_key(node, sibling_states, game_order_first_round_counts):
    path = node.path
    base_key = visual_path_key(path)
    parent_path = path[:-1]
    matching_block_paths = [
        block_path
        for block_path in game_order_first_round_counts
        if path.startswith(block_path)
    ]
    block_path = max(matching_block_paths, key=len, default="")

    if block_path in game_order_first_round_counts and game_order_first_round_counts[block_path] == 1:
        sibling_state_values = sibling_states.get(parent_path, set())
        if (
            ("P", "P") in sibling_state_values
            and (("P", "G") in sibling_state_values or ("G", "P") in sibling_state_values)
        ):
            return base_key[:-1] + ("0" if node_state(node) == ("P", "P") else "1")

    return base_key


def count_first_rounds(slot_players, start, end):
    return sum(
        1
        for slot_index in range(start, end, 2)
        if slot_players[slot_index] and slot_players[slot_index + 1]
    )


def slot_range_for_path(slot_count, path):
    start = 0
    end = slot_count
    for direction in path:
        middle = (start + end) // 2
        if direction == "L":
            end = middle
        else:
            start = middle
    return start, end


def game_order_block_paths(slot_count):
    if slot_count == 16:
        return ("",)
    if slot_count == 32:
        return ("L", "R")
    if slot_count >= 64:
        return ("LL", "RR")
    return ()


def count_game_order_first_rounds(slot_players):
    slot_count = len(slot_players)
    return {
        block_path: count_first_rounds(
            slot_players,
            *slot_range_for_path(slot_count, block_path),
        )
        for block_path in game_order_block_paths(slot_count)
    }


def count_first_rounds_by_seed_block(slot_players):
    slot_count = len(slot_players)
    if slot_count < 8:
        return {"LL": 0, "LR": 0, "RL": 0, "RR": 0}

    block_size = slot_count // 4
    block_ranges = {
        "LL": (0, block_size),
        "LR": (block_size, block_size * 2),
        "RL": (block_size * 2, block_size * 3),
        "RR": (block_size * 3, slot_count),
    }
    return {
        block_path: count_first_rounds(slot_players, start, end)
        for block_path, (start, end) in block_ranges.items()
    }


def build_slot_players(player_ids):
    slot_count = next_power_of_two(len(player_ids))
    seeds = seed_order(slot_count)
    seed_to_index = {seed: index for index, seed in enumerate(seeds)}
    occupied_slots = [True] * slot_count
    bye_count = slot_count - len(player_ids)

    for seed in range(1, bye_count + 1):
        seed_index = seed_to_index[seed]
        opponent_index = seed_index + 1 if seed_index % 2 == 0 else seed_index - 1
        occupied_slots[opponent_index] = False

    assigned_players = iter(player_ids)
    return [
        next(assigned_players) if occupied else ""
        for occupied in occupied_slots
    ]


def build_games(player_ids):
    final_id = len(player_ids)
    third_place_id = final_id - 1
    slot_players = build_slot_players(player_ids)

    def build_node(start, end, path=""):
        if end - start == 1:
            player_id = slot_players[start]
            return Node(path=path, player_id=player_id) if player_id else None

        middle = (start + end) // 2
        left = build_node(start, middle, f"{path}L")
        right = build_node(middle, end, f"{path}R")
        if left and right:
            return Node(path=path, left=left, right=right)
        return left or right

    def collect_game_nodes(node):
        if not node or node.player_id:
            return []
        return collect_game_nodes(node.left) + collect_game_nodes(node.right) + [node]

    def set_side(game, side, node):
        if node.player_id:
            if side == "left":
                game.left_player_id = node.player_id
            else:
                game.right_player_id = node.player_id
            return

        if side == "left":
            node.game.next_left_id = str(game.id)
        else:
            node.game.next_right_id = str(game.id)

    root = build_node(0, len(slot_players))
    root.game_id = final_id

    game_nodes = [node for node in collect_game_nodes(root) if node is not root]
    sibling_states = {}
    game_order_first_round_counts = count_game_order_first_rounds(slot_players)
    for node in game_nodes:
        sibling_states.setdefault(node.path[:-1], set()).add(node_state(node))

    visual_ranks = {}
    for depth in sorted({len(node.path) for node in game_nodes}):
        nodes_at_depth = [node for node in game_nodes if len(node.path) == depth]
        for rank, node in enumerate(
            sorted(
                nodes_at_depth,
                key=lambda node: game_order_key(
                    node,
                    sibling_states,
                    game_order_first_round_counts,
                ),
            )
        ):
            visual_ranks[node.path] = rank

    for game_id, node in enumerate(
        sorted(
            game_nodes,
            key=lambda node: (
                -len(node.path),
                visual_ranks[node.path],
            ),
        ),
        start=1,
    ):
        node.game_id = game_id

    games = []
    for node in collect_game_nodes(root):
        node.game = Game(id=node.game_id)
    for node in collect_game_nodes(root):
        set_side(node.game, "left", node.left)
        set_side(node.game, "right", node.right)
        games.append(node.game)

    games.append(Game(id=third_place_id))
    return sorted(games, key=lambda game: game.id)


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
    generated_event_names = []
    for event_name in event_names:
        player_column = f"{event_name}_player_id"
        player_ids = player_ids_from_rows(output_rows, player_column)
        if len(player_ids) < 2:
            print(f"skipped {event_name} ({len(player_ids)} players)", file=sys.stderr)
            continue

        rng.shuffle(player_ids)
        games = build_games(player_ids)
        output_csv = Path("data") / args.competition / "original" / f"{event_name}.csv"

        output_csv.parent.mkdir(parents=True, exist_ok=True)
        with output_csv.open("w", encoding="utf-8", newline="") as f:
            write_games(games, f)
        print(f"wrote {output_csv} ({len(player_ids)} players, {len(games)} rows)")
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
    parser.add_argument("--seed", type=int, help="random seed for reproducible shuffling")
    return parser.parse_args()


def main():
    args = parse_args()
    generate_from_source_csvs(args)


if __name__ == "__main__":
    main()
