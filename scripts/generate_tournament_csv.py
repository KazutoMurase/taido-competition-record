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

RIGHT_SMALL_BRANCH_FLIP_LIMIT = 9
# These two keep game numbering aligned with existing student brackets.
# They only affect adjacent outer-column game IDs, not the bracket shape.
LEFT_OUTER_GAME_ID_SWAP_LIMIT = 39
RIGHT_OUTER_GAME_ID_SWAP_PLAYER_COUNT = 37


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


def read_player_ids(players_csv, player_column):
    fieldnames, rows = read_players_table(players_csv)
    if player_column not in fieldnames:
        raise ValueError(f"column not found in {players_csv}: {player_column}")
    player_ids = [row[player_column].strip() for row in rows if row[player_column].strip()]
    if len(player_ids) < 2:
        raise ValueError(f"{player_column} needs at least 2 players, got {len(player_ids)}")
    return player_ids


def balanced_left_count(player_count, path):
    if player_count % 2 == 0:
        return player_count // 2
    if player_count == 3:
        return 2 if path.endswith("R") else 1
    if player_count % 4 == 1:
        left_big = True
        if path.endswith("R") and player_count <= RIGHT_SMALL_BRANCH_FLIP_LIMIT:
            left_big = not left_big
        return (player_count + 1) // 2 if left_big else player_count // 2

    left_big = False
    return (player_count + 1) // 2 if left_big else player_count // 2


def visual_order_key(path, player_count):
    if player_count <= LEFT_OUTER_GAME_ID_SWAP_LIMIT:
        if path == "LLLR":
            return "0LLLL"
        if path == "LLLL":
            return "0LLLR"
    if player_count == RIGHT_OUTER_GAME_ID_SWAP_PLAYER_COUNT:
        if path == "RRRL":
            return "1LLLL"
        if path == "RRRR":
            return "1LLLR"
    if not path:
        return ""
    if path[0] == "L":
        return "0" + path[1:]
    return "1" + path[1:].translate(str.maketrans("LR", "RL"))


def game_id_order_key(node, player_count):
    return (-len(node.path), visual_order_key(node.path, player_count))


def build_games(player_ids):
    final_id = len(player_ids)
    third_place_id = final_id - 1

    def build_node(node_player_ids, path=""):
        if len(node_player_ids) == 1:
            return Node(path=path, player_id=node_player_ids[0])

        left_count = balanced_left_count(len(node_player_ids), path)
        return Node(
            path=path,
            left=build_node(node_player_ids[:left_count], f"{path}L"),
            right=build_node(node_player_ids[left_count:], f"{path}R"),
        )

    def collect_game_nodes(node):
        if node.player_id:
            return []
        nodes = collect_game_nodes(node.left)
        nodes.extend(collect_game_nodes(node.right))
        nodes.append(node)
        return nodes

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

    root = build_node(player_ids)
    root.game_id = final_id

    game_nodes = [node for node in collect_game_nodes(root) if node is not root]
    for game_id, node in enumerate(
        sorted(game_nodes, key=lambda node: game_id_order_key(node, len(player_ids))),
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


def list_player_columns(players_csv):
    fieldnames, _ = read_players_table(players_csv)
    return [
        field
        for field in fieldnames
        if field.endswith("_player_id") and not field.startswith("dantai_")
    ]


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


def generate_one(args, player_column):
    players_csv = args.players_csv or Path("data") / args.competition / "static" / "players.csv"
    event_name = player_column_to_event_name(player_column)
    output_csv = args.output or Path("data") / args.competition / "original" / f"{event_name}.csv"
    player_ids = read_player_ids(players_csv, player_column)
    rng = random.Random(args.seed)
    rng.shuffle(player_ids)
    games = build_games(player_ids)

    if args.dry_run:
        print(f"# {player_column}: {len(player_ids)} players -> {len(games)} rows", file=sys.stderr)
        write_games(games, sys.stdout)
        return

    if output_csv.exists() and not args.force:
        raise FileExistsError(f"{output_csv} already exists. Use --force to overwrite it.")
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", encoding="utf-8", newline="") as f:
        write_games(games, f)
    print(f"wrote {output_csv} ({len(player_ids)} players, {len(games)} rows)")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate an individual tournament CSV from a players.csv *_player_id column."
    )
    parser.add_argument("competition", help="competition name under data/, e.g. 2025_kid")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--event", help="event name, e.g. hokei_man")
    group.add_argument("--player-column", help="players.csv column, e.g. hokei_man_player_id")
    group.add_argument("--all", action="store_true", help="generate all *_player_id columns")
    parser.add_argument("--players-csv", type=Path, help="override players.csv path")
    parser.add_argument("--output", type=Path, help="override output CSV path; cannot be used with --all")
    parser.add_argument("--seed", type=int, help="random seed for reproducible shuffling")
    parser.add_argument("--force", action="store_true", help="overwrite existing output CSV")
    parser.add_argument("--dry-run", action="store_true", help="write generated CSV to stdout")
    args = parser.parse_args()
    if args.all and args.output:
        parser.error("--output cannot be used with --all")
    return args


def main():
    args = parse_args()
    players_csv = args.players_csv or Path("data") / args.competition / "static" / "players.csv"
    if args.all:
        for player_column in list_player_columns(players_csv):
            generate_one(args, player_column)
        return

    player_column = args.player_column or f"{args.event}_player_id"
    generate_one(args, player_column)


if __name__ == "__main__":
    main()
