#!/usr/bin/env python3
import argparse
import csv
import importlib.util
import random
import sys
from pathlib import Path

try:
    from PyQt5.QtCore import Qt
    from PyQt5.QtGui import QColor, QFont, QPainter, QPen
    from PyQt5.QtWidgets import (
        QApplication,
        QHBoxLayout,
        QLabel,
        QMainWindow,
        QScrollArea,
        QVBoxLayout,
        QWidget,
    )
except ModuleNotFoundError as e:
    if e.name != "PyQt5":
        raise
    sys.exit("PyQt5 is required. Install PyQt5 or run this in the same environment as print_certificate.py.")


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent


def load_generator():
    path = SCRIPT_DIR / "generate_tournament_csv.py"
    spec = importlib.util.spec_from_file_location("generate_tournament_csv", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


generator = load_generator()


def read_rows(path):
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def read_games(path):
    games = []
    for row in read_rows(path):
        games.append(
            generator.Game(
                id=int(row["id"]),
                left_player_id=row.get("left_player_id", "").strip(),
                right_player_id=row.get("right_player_id", "").strip(),
                next_left_id=row.get("next_left_id", "").strip(),
                next_right_id=row.get("next_right_id", "").strip(),
            )
        )
    return games


def read_players(players_csv, player_column):
    rows = read_rows(players_csv)
    player_ids = []
    player_names = {}
    for row in rows:
        player_id = row.get(player_column, "").strip()
        if not player_id:
            continue
        player_ids.append(player_id)
        player_names[player_id] = row.get("name", "").strip()
    if len(player_ids) < 2:
        raise ValueError(f"{player_column} needs at least 2 players")
    return player_ids, player_names


class TournamentModel:
    def __init__(self, title, games, player_names):
        self.title = title
        self.games = {str(game.id): game for game in games}
        self.player_names = player_names
        self.children = {game_id: {} for game_id in self.games}
        for game in games:
            if game.next_left_id:
                self.children.setdefault(game.next_left_id, {})["L"] = str(game.id)
            if game.next_right_id:
                self.children.setdefault(game.next_right_id, {})["R"] = str(game.id)

        ids = sorted(int(game_id) for game_id in self.games)
        self.final_id = str(ids[-1])
        self.third_place_id = str(ids[-2]) if len(ids) >= 2 else None
        self.node_paths = {}
        self.node_rounds = {}
        self.path_states = {}
        self._collect_paths(self.final_id, "")

    def _side_kind(self, game_id, side):
        game = self.games[game_id]
        player_id = game.left_player_id if side == "L" else game.right_player_id
        if player_id:
            return "player"
        if side in self.children.get(game_id, {}):
            return "game"
        return "empty"

    def _collect_paths(self, game_id, path):
        self.node_paths[game_id] = path
        self.path_states[path] = (
            self._side_kind(game_id, "L"),
            self._side_kind(game_id, "R"),
        )
        child_rounds = []
        for side in ("L", "R"):
            child_id = self.children.get(game_id, {}).get(side)
            if child_id:
                child_rounds.append(self._collect_paths(child_id, path + side))
            elif self._side_kind(game_id, side) == "player":
                child_rounds.append(0)
        round_num = max(child_rounds, default=0) + 1
        self.node_rounds[game_id] = round_num
        return round_num

    def player_label(self, player_id):
        name = self.player_names.get(player_id, "")
        if name:
            return f"{player_id}: {name}"
        return player_id

    def api_like_input_paths(self, bracket_side):
        child_id = self.children.get(self.final_id, {}).get(bracket_side)
        if not child_id:
            return []
        if bracket_side == "L":
            return self._left_block_input_paths(child_id)
        return self._right_block_input_paths(child_id)

    def _left_block_input_paths(self, game_id):
        paths = []
        left_child = self.children.get(game_id, {}).get("L")
        if left_child:
            paths.extend(self._left_block_input_paths(left_child))
        paths.extend(self._direct_input_paths(game_id, ("L", "R")))
        right_child = self.children.get(game_id, {}).get("R")
        if right_child:
            paths.extend(self._left_block_input_paths(right_child))
        return paths

    def _right_block_input_paths(self, game_id):
        game_paths = []

        def collect(node_id):
            left_child = self.children.get(node_id, {}).get("L")
            if left_child:
                collect(left_child)
            if self._direct_input_paths(node_id, ("R", "L")):
                game_paths.insert(0, node_id)
            right_child = self.children.get(node_id, {}).get("R")
            if right_child:
                collect(right_child)

        collect(game_id)
        paths = []
        for node_id in game_paths:
            paths.extend(self._direct_input_paths(node_id, ("R", "L")))
        return paths

    def _direct_input_paths(self, game_id, sides):
        path = self.node_paths[game_id]
        return [
            path + side
            for side in sides
            if self._side_kind(game_id, side) == "player"
        ]


class TournamentWidget(QWidget):
    margin_x = 16
    margin_y = 24
    row_height = 26
    col_width = 34
    player_width = 118
    player_to_first_game_gap = 42
    game_width = 20
    game_height = 12

    def __init__(self, model, diff_paths, input_path_rows, layout_depths):
        super().__init__()
        self.model = model
        self.diff_paths = diff_paths
        self.input_path_rows = input_path_rows
        self.layout_depths = layout_depths
        self.positions = {}
        self.input_positions = {}
        self.game_label_y_overrides = {}
        self.center_x = 0
        self.content_width = 0
        self._layout_tree()

    def _layout_tree(self):
        self.positions = {}
        self.input_positions = {}
        left_depth = self.layout_depths["L"]
        right_depth = self.layout_depths["R"]
        self.center_x = (
            self.margin_x
            + self.player_width
            + self.player_to_first_game_gap
            + left_depth * self.col_width
        )
        self._layout_node(self.model.final_id)
        leaf_count = max(max(self.input_path_rows.values(), default=0) + 1, 1)
        self.content_width = (
            self.center_x
            + self.game_width
            + right_depth * self.col_width
            + self.player_to_first_game_gap
            + self.player_width
            + self.margin_x
        )
        height = self.margin_y * 2 + (leaf_count + 2) * self.row_height
        if self.model.third_place_id:
            height += self.row_height * 2
        self.setMinimumSize(self.content_width, height)

    def _layout_node(self, game_id):
        path = self.model.node_paths.get(game_id, "")
        child_ys = []
        for side in ("L", "R"):
            child_id = self.model.children.get(game_id, {}).get(side)
            if child_id:
                self._layout_node(child_id)
                child_ys.append(self.positions[child_id][1])
            else:
                game = self.model.games[game_id]
                player_id = game.left_player_id if side == "L" else game.right_player_id
                if player_id:
                    leaf_y = self._input_y(path + side)
                    self.input_positions[(game_id, side)] = leaf_y
                    child_ys.append(leaf_y)

        if child_ys:
            y = sum(child_ys) / len(child_ys)
        else:
            y = self.margin_y
        x = self._game_x(path)
        self.positions[game_id] = (x, y)

    def _input_y(self, input_path):
        row = self.input_path_rows.get(input_path, len(self.input_path_rows))
        return self.margin_y + row * self.row_height

    def _game_x(self, path):
        if not path:
            return self.center_x
        depth = len(path)
        if path.startswith("L"):
            return self.center_x - depth * self.col_width
        return self.center_x + depth * self.col_width

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.fillRect(self.rect(), QColor("#ffffff"))
        painter.setFont(QFont("Sans Serif", 8))
        self.game_label_y_overrides = {}
        self._draw_final(painter)
        if self.model.third_place_id:
            self._draw_third_place(painter)

    def _draw_final(self, painter):
        final_id = self.model.final_id
        final_game = self.model.games[final_id]
        x, y = self.positions[final_id]
        left_child_id = self.model.children.get(final_id, {}).get("L")
        right_child_id = self.model.children.get(final_id, {}).get("R")
        line_y = y
        if left_child_id:
            self.game_label_y_overrides[left_child_id] = line_y
        if right_child_id:
            self.game_label_y_overrides[right_child_id] = line_y

        if left_child_id:
            self._draw_node(painter, left_child_id)
        if right_child_id:
            self._draw_node(painter, right_child_id)

        left_x = x
        right_x = x
        if left_child_id:
            left_x = self.positions[left_child_id][0]
            painter.setPen(QPen(QColor("#555555"), 1))
            self._draw_vertical_to_game_label(
                painter, left_x, self.positions[left_child_id][1], line_y
            )
        elif final_game.left_player_id:
            left_y = self._input_y("L")
            self._draw_player(painter, x, left_y, final_game.left_player_id, "L")
            left_x = self._player_anchor_x("L")
            painter.setPen(QPen(QColor("#999999"), 1))
            painter.drawLine(int(left_x), int(left_y), int(left_x), int(line_y))

        if right_child_id:
            right_x = self.positions[right_child_id][0]
            painter.setPen(QPen(QColor("#555555"), 1))
            self._draw_vertical_to_game_label(
                painter, right_x, self.positions[right_child_id][1], line_y
            )
        elif final_game.right_player_id:
            right_y = self._input_y("R")
            self._draw_player(painter, x, right_y, final_game.right_player_id, "R")
            right_x = self._player_anchor_x("R")
            painter.setPen(QPen(QColor("#999999"), 1))
            painter.drawLine(int(right_x), int(right_y), int(right_x), int(line_y))

        painter.setPen(QPen(QColor("#555555"), 1))
        painter.drawLine(int(left_x), int(line_y), int(right_x), int(line_y))
        if left_child_id:
            left_path = self.model.node_paths.get(left_child_id, "")
            self._draw_game(
                painter,
                left_x,
                line_y,
                self.model.games[left_child_id].id,
                left_path in self.diff_paths,
            )
        if right_child_id:
            right_path = self.model.node_paths.get(right_child_id, "")
            self._draw_game(
                painter,
                right_x,
                line_y,
                self.model.games[right_child_id].id,
                right_path in self.diff_paths,
            )
        self._draw_game(painter, x, line_y, final_game.id, "" in self.diff_paths)

    def _draw_node(self, painter, game_id):
        game = self.model.games[game_id]
        x, y = self.positions[game_id]
        path = self.model.node_paths.get(game_id, "")
        is_diff = path in self.diff_paths
        label_y = self.game_label_y_overrides.get(game_id, y)

        for side in ("L", "R"):
            child_id = self.model.children.get(game_id, {}).get(side)
            if child_id:
                self._draw_node(painter, child_id)
                cx, cy = self.positions[child_id]
                self._draw_connector(painter, cx, cy, x, label_y, path + side)
            else:
                player_id = game.left_player_id if side == "L" else game.right_player_id
                if player_id:
                    leaf_y = self.input_positions.get((game_id, side), y)
                    self._draw_player(painter, x, leaf_y, player_id, path + side)
                    self._draw_short_connector(painter, x, label_y, leaf_y, path + side)

        self._draw_game(painter, x, label_y, game.id, is_diff)

    def _draw_connector(self, painter, child_x, child_y, parent_x, parent_y, path):
        pen = QPen(QColor("#555555"), 1)
        painter.setPen(pen)
        if parent_x >= child_x:
            start_x = child_x + self.game_width / 2
            end_x = parent_x - self.game_width / 2
        else:
            start_x = child_x - self.game_width / 2
            end_x = parent_x + self.game_width / 2
        painter.drawLine(int(start_x), int(child_y), int(end_x), int(child_y))
        painter.drawLine(int(end_x), int(child_y), int(end_x), int(parent_y))

    def _draw_vertical_to_game_label(self, painter, x, from_y, label_y):
        half_height = self.game_height / 2
        if from_y < label_y:
            to_y = label_y - half_height
        else:
            to_y = label_y + half_height
        painter.drawLine(int(x), int(from_y), int(x), int(to_y))

    def _draw_short_connector(self, painter, game_x, game_y, leaf_y, path):
        painter.setPen(QPen(QColor("#999999"), 1))
        if path.startswith("L"):
            start_x = self._player_anchor_x(path)
            end_x = game_x - self.game_width / 2
        else:
            start_x = self._player_anchor_x(path)
            end_x = game_x + self.game_width / 2
        painter.drawLine(int(start_x), int(leaf_y), int(end_x), int(leaf_y))
        painter.drawLine(int(end_x), int(leaf_y), int(end_x), int(game_y))

    def _draw_game(self, painter, x, y, game_id, is_diff):
        rect_x = int(x - self.game_width / 2)
        rect_y = int(y - self.game_height / 2)
        color = QColor("#ffe8e8") if is_diff else QColor("#f3f6fa")
        painter.setPen(QPen(QColor("#555555"), 1))
        painter.setBrush(color)
        painter.fillRect(rect_x, rect_y, self.game_width, self.game_height, color)
        painter.drawRect(rect_x, rect_y, self.game_width, self.game_height)
        painter.setPen(QColor("#111111"))
        painter.setFont(QFont("Sans Serif", 7))
        painter.drawText(
            rect_x,
            rect_y,
            self.game_width,
            self.game_height,
            Qt.AlignCenter,
            str(game_id),
        )
        painter.setFont(QFont("Sans Serif", 8))

    def _draw_player(self, painter, game_x, y, player_id, path):
        painter.setPen(QColor("#333333"))
        if path.startswith("L"):
            x = self.margin_x
            align = Qt.AlignVCenter | Qt.AlignRight
        else:
            x = self.content_width - self.margin_x - self.player_width
            align = Qt.AlignVCenter | Qt.AlignLeft
        painter.drawText(
            int(x),
            int(y - 8),
            self.player_width,
            16,
            align,
            self.model.player_label(player_id),
        )

    def _player_anchor_x(self, path):
        if path.startswith("L"):
            return self.margin_x + self.player_width + 4
        return self.content_width - self.margin_x - self.player_width - 4

    def _draw_third_place(self, painter):
        game = self.model.games[self.model.third_place_id]
        y = self.height() - self.margin_y - self.row_height
        x = self.margin_x
        painter.setPen(QPen(QColor("#777777"), 1))
        painter.setBrush(QColor("#f7f7f7"))
        painter.drawRect(x, y, self.game_width, self.game_height)
        painter.setPen(QColor("#111111"))
        painter.drawText(x + 6, y, self.game_width, self.game_height, Qt.AlignVCenter, "3rd place")
        labels = []
        if game.left_player_id:
            labels.append(self.model.player_label(game.left_player_id))
        if game.right_player_id:
            labels.append(self.model.player_label(game.right_player_id))
        painter.drawText(
            x + self.game_width + 12,
            y,
            self.width() - x - self.game_width - 24,
            self.game_height,
            Qt.AlignVCenter | Qt.AlignLeft,
            " / ".join(labels),
        )


class CompareWindow(QMainWindow):
    def __init__(self, original_model, generated_model):
        super().__init__()
        self.setWindowTitle("Tournament Compare")
        self.resize(1700, 950)

        diff_paths = {
            path
            for path, state in original_model.path_states.items()
            if generated_model.path_states.get(path) != state
        }
        diff_paths.update(
            path
            for path, state in generated_model.path_states.items()
            if original_model.path_states.get(path) != state
        )
        layout_depths = self._layout_depths(original_model, generated_model)

        root = QWidget()
        layout = QHBoxLayout()
        layout.addWidget(self._pane(original_model, diff_paths, layout_depths))
        layout.addWidget(self._pane(generated_model, diff_paths, layout_depths))
        root.setLayout(layout)
        self.setCentralWidget(root)

    def _input_path_rows(self, model):
        rows = {}
        for bracket_side in ("L", "R"):
            for index, path in enumerate(model.api_like_input_paths(bracket_side)):
                rows[path] = index
        return rows

    def _layout_depths(self, original_model, generated_model):
        depths = {}
        for bracket_side in ("L", "R"):
            depths[bracket_side] = max(
                [
                    len(path)
                    for model in (original_model, generated_model)
                    for path in model.node_paths.values()
                    if path.startswith(bracket_side)
                ],
                default=1,
            )
        return depths

    def _pane(self, model, diff_paths, layout_depths):
        pane = QWidget()
        layout = QVBoxLayout()
        title = QLabel(model.title)
        title.setStyleSheet("font-weight: bold; font-size: 16px;")
        layout.addWidget(title)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        input_path_rows = self._input_path_rows(model)
        scroll.setWidget(TournamentWidget(model, diff_paths, input_path_rows, layout_depths))
        scroll.setMinimumWidth(800)
        layout.addWidget(scroll)
        pane.setLayout(layout)
        return pane


def parse_args():
    parser = argparse.ArgumentParser(
        description="Show original and generated tournament CSVs side by side."
    )
    parser.add_argument("competition", help="competition name under data/, e.g. 2025_kid")
    parser.add_argument("event", help="event name, e.g. hokei_man")
    parser.add_argument("--seed", type=int, help="random seed for generated player shuffle")
    parser.add_argument("--players-csv", type=Path, help="override players.csv path")
    parser.add_argument("--original-csv", type=Path, help="override original tournament CSV path")
    return parser.parse_args()


def display_path(path):
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def main():
    args = parse_args()
    player_column = f"{args.event}_player_id"
    players_csv = args.players_csv or REPO_ROOT / "data" / args.competition / "static" / "players.csv"
    original_csv = (
        args.original_csv
        or REPO_ROOT / "data" / args.competition / "original" / f"{args.event}.csv"
    )

    player_ids, player_names = read_players(players_csv, player_column)
    rng = random.Random(args.seed)
    rng.shuffle(player_ids)

    original_games = read_games(original_csv)
    generated_games = generator.build_games(player_ids)

    original_model = TournamentModel(
        f"Original: {display_path(original_csv)}", original_games, player_names
    )
    generated_model = TournamentModel(
        f"Generated: {args.competition}/{args.event} seed={args.seed}",
        generated_games,
        player_names,
    )

    app = QApplication(sys.argv)
    window = CompareWindow(original_model, generated_model)
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
