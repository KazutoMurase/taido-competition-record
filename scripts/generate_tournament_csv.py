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
        description="Generate an individual tournament CSV from seeded power-of-two slots."
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
