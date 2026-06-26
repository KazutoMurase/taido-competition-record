from dataclasses import dataclass

from tournament_player_placement import build_slot_players


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


def build_games_from_slots(slot_players):
    final_id = len([player_id for player_id in slot_players if player_id])
    third_place_id = final_id - 1

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


def build_games(player_ids):
    return build_games_from_slots(build_slot_players(player_ids))
