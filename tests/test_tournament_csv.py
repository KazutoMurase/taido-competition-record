import contextlib
import csv
import io
import multiprocessing
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ProcessPoolExecutor
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import generate_tournament_csv as generator
from tournament_player_placement import (
    BalancedGroupPlacementStrategy,
    PlacementPlayer,
    SmartSeedPlacementStrategy,
    build_slots,
)


def fillers(count):
    return [PlacementPlayer(f"other{i}", f"other-group{i}") for i in range(count)]


def placed_slots(players, strategy):
    ids = strategy.build_slot_players(players)
    assert sorted(p for p in ids if p) == sorted(p.player_id for p in players)
    slots = build_slots(len(players))
    for slot, player_id in zip(slots, ids):
        slot.player_id = player_id
    return slots


class BlockingProgressQueue:
    """Hold a worker inside its first report until the test sees the output."""

    def __init__(self, messages, release):
        self.messages = messages
        self.release = release

    def put(self, message):
        self.messages.put(message)
        if not self.release.wait(10):
            raise RuntimeError("test did not receive live progress")


class PlacementTests(unittest.TestCase):
    def strategy(self, **kwargs):
        return SmartSeedPlacementStrategy(seed=1, max_attempts=5, max_search_nodes=200, **kwargs)

    def test_group_ranks_reflect_together(self):
        for higher_seeds in range(4):
            with self.subTest(higher_seeds=higher_seeds):
                players = [PlacementPlayer(str(i), "group", str(i)) for i in range(1, 5)]
                players += [PlacementPlayer(f"fixed{i}", f"fixed-group{i}", rank_total=str(i + 1))
                            for i in range(higher_seeds)]
                players += fillers(16 - len(players))
                slots = placed_slots(players, self.strategy())
                quarters = {s.player_id: self.strategy().QUARTERS.index(s.visual_quarter) for s in slots}
                anchor = quarters["1"]
                self.assertEqual([quarters[str(i)] ^ anchor for i in range(1, 5)], [0, 3, 2, 1])

    def test_recommendation_plus_four_ranks_in_each_corner(self):
        for seed in range(1, 5):
            with self.subTest(seed=seed):
                players = [PlacementPlayer("rec", "group", rank_lastyear="1", rank_total=str(seed))]
                players += [PlacementPlayer(str(i), "group", str(i)) for i in range(1, 5)]
                players += [PlacementPlayer(f"fixed{i}", f"fixed-group{i}", rank_total=str(i))
                            for i in range(1, seed)]
                players += fillers(16 - len(players))
                slots = placed_slots(players, self.strategy())
                quarters = {s.player_id: self.strategy().QUARTERS.index(s.visual_quarter) for s in slots}
                self.assertEqual([quarters[str(i)] ^ quarters["rec"] for i in range(1, 5)], [3, 2, 1, 0])
                self.assertEqual(next(s.seed for s in slots if s.player_id == "rec"), seed)

    def test_total_rank_precedes_lastyear_and_group_rank(self):
        players = [PlacementPlayer("total", "a", rank_total="9"),
                   PlacementPlayer("rec", "b", rank_lastyear="1"),
                   PlacementPlayer("group", "c", rank_group="1")] + fillers(13)
        slots = placed_slots(players, self.strategy())
        seeds = {s.player_id: s.seed for s in slots}
        self.assertEqual(seeds["total"], 1)
        self.assertEqual(seeds["rec"], 2)

    def test_recommendation_group_rank_does_not_override_recommendation(self):
        players = [PlacementPlayer("rec", "g", "1", "1"),
                   PlacementPlayer("one", "g", "1"), PlacementPlayer("two", "g", "2")]
        slots = placed_slots(players + fillers(5), self.strategy())
        quarters = {s.player_id: s.visual_quarter for s in slots}
        self.assertEqual((quarters["rec"], quarters["one"], quarters["two"]),
                         ("left_top", "right_bottom", "right_top"))

    def test_multiple_recommendations_preserve_seeds_and_fill_empty_quarters(self):
        players = [PlacementPlayer("rec1", "g", rank_lastyear="1"),
                   PlacementPlayer("rec2", "g", rank_lastyear="2")]
        players += [PlacementPlayer(str(i), "g", str(i)) for i in range(1, 5)]
        slots = placed_slots(players + fillers(10), self.strategy())
        quarters = {s.player_id: s.visual_quarter for s in slots}
        self.assertEqual([quarters[p] for p in ("rec1", "rec2")], ["left_top", "right_bottom"])
        self.assertEqual([quarters[str(i)] for i in range(1, 5)],
                         ["right_top", "left_bottom", "right_bottom", "left_top"])

    def test_recommendation_outside_seed_limit_is_placed_before_group_ranks(self):
        players = [PlacementPlayer("total", "other", rank_total="1"),
                   PlacementPlayer("rec", "g", rank_lastyear="1")]
        players += [PlacementPlayer(str(i), "g", str(i)) for i in range(1, 5)]
        slots = placed_slots(players + fillers(10), self.strategy(max_seed=1))
        quarters = {s.player_id: self.strategy().QUARTERS.index(s.visual_quarter) for s in slots}
        self.assertEqual([quarters[str(i)] ^ quarters["rec"] for i in range(1, 5)], [3, 2, 1, 0])

    def test_missing_rank_and_byes_keep_rank_relationship(self):
        players = [PlacementPlayer("one", "g", "1"), PlacementPlayer("three", "g", "3")]
        slots = placed_slots(players + fillers(7), self.strategy())
        quarters = {s.player_id: self.strategy().QUARTERS.index(s.visual_quarter) for s in slots if s.player_id}
        self.assertEqual(quarters["one"] ^ quarters["three"], 2)
        self.assertEqual(sum(not s.player_id for s in slots), 7)

    def test_two_player_bracket_separates_ranks_one_and_two(self):
        players = [PlacementPlayer("one", "g", "1"), PlacementPlayer("two", "g", "2")]
        slots = placed_slots(players, self.strategy())
        self.assertNotEqual(slots[0].visual_half, slots[1].visual_half)

    def test_conflicting_fixed_seeds_fail_even_after_relaxation(self):
        players = [PlacementPlayer("one", "g", "1", rank_total="1"),
                   PlacementPlayer("two", "g", "2", rank_total="3"),
                   PlacementPlayer("other", "other", rank_total="2")] + fillers(5)
        with self.assertRaisesRegex(ValueError, "fixed seeds conflict"):
            self.strategy().build_slot_players(players)

    def test_complete_validation_rejects_wrong_rank_relationship(self):
        players = [PlacementPlayer(str(i), "g", str(i)) for i in range(1, 5)]
        slots = placed_slots(players + fillers(4), self.strategy())
        one = next(s for s in slots if s.player_id == "1")
        four = next(s for s in slots if s.player_id == "4")
        one.player_id, four.player_id = four.player_id, one.player_id
        strategy = self.strategy()
        strategy.relaxed_constraints = set(strategy.RELAX_ORDER)
        self.assertFalse(strategy.is_complete_placement_valid(slots, {p.player_id: p for p in players + fillers(4)}))

    def test_balanced_does_not_apply_smart_group_rank_pattern(self):
        players = [PlacementPlayer("one", "g", "1", "1"),
                   PlacementPlayer("two", "g", "2", "3"),
                   PlacementPlayer("other", "other", rank_lastyear="2")] + fillers(5)
        slots = placed_slots(players, BalancedGroupPlacementStrategy(seed=1, max_attempts=3, max_search_nodes=100))
        self.assertEqual(next(s.seed for s in slots if s.player_id == "two"), 3)


class CsvTests(unittest.TestCase):
    def test_standard_quoted_fields_keep_whitespace_newlines_commas_and_quotes(self):
        rows = [["id", "name", "comment"], ["1", " A B ", 'line1\nline2, "quote"']]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "players.csv"
            with path.open("w", encoding="utf-8-sig", newline="") as output:
                csv.writer(output, quoting=csv.QUOTE_ALL).writerows(rows)
            fields, records = generator.read_players_table(path)
        self.assertEqual(fields, rows[0])
        self.assertEqual(records, [dict(zip(rows[0], rows[1]))])

    def test_unquoted_newline_is_not_repaired(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "players.csv"
            path.write_text("id,name,comment\n1,A,line1\nline2\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "columns, expected"):
                generator.read_players_table(path)

    def test_fallback_option_is_removed(self):
        with patch.object(sys, "argv", ["generate", "test", "--source-csv", "input.csv", "--fallback-to-random"]):
            with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as caught:
                generator.parse_args()
        self.assertEqual(caught.exception.code, 2)


class ProgressTests(unittest.TestCase):
    def test_attempts_are_reported_during_work_and_do_not_change_randomness(self):
        players = [PlacementPlayer(str(i), "g", str(i)) for i in range(1, 5)] + fillers(4)
        messages = []
        strategy = SmartSeedPlacementStrategy(seed=7, progress_label="event", progress_callback=messages.append)
        actual = strategy.build_slot_players(players)
        expected = SmartSeedPlacementStrategy(seed=7).build_slot_players(players)
        self.assertEqual(actual, expected)
        self.assertIn("attempt=1/100", messages[0])
        self.assertIn("phase=seeds", messages[0])
        self.assertTrue(any("phase=search" in message for message in messages))
        self.assertIn("success", messages[-1])

    def test_long_attempt_reports_node_counts_before_completion(self):
        messages = []
        strategy = SmartSeedPlacementStrategy(progress_label="slow", progress_callback=messages.append)
        strategy.phase = "search"
        strategy.attempt_number = 1
        strategy.attempt_limit = 100
        strategy.search_nodes = 123
        with patch("tournament_player_placement.time.monotonic", return_value=strategy.started_at + 2):
            strategy.report_progress()
        self.assertIn("nodes=123/1000", messages[0])
        self.assertIn("elapsed=2.0s", messages[0])

    def test_failure_reports_attempts_and_reason_without_random_fallback(self):
        players = [PlacementPlayer("one", "g", "1", rank_total="1"),
                   PlacementPlayer("two", "g", "2", rank_total="3"),
                   PlacementPlayer("other", "other", rank_total="2")] + fillers(5)
        output = io.StringIO()
        with contextlib.redirect_stderr(output):
            event, count, games, error = generator.build_individual_event(("failure", players, "smart", 1, 5, 100, None))
        self.assertEqual((event, count, games), ("failure", 8, None))
        self.assertIn("fixed seeds conflict", error)
        self.assertIn("attempt=5/5", output.getvalue())
        self.assertIn("failed:", output.getvalue())

    def test_parallel_progress_is_visible_before_worker_returns(self):
        with multiprocessing.Manager() as manager:
            messages = manager.Queue()
            release = manager.Event()
            blocking_queue = BlockingProgressQueue(messages, release)
            with ProcessPoolExecutor(max_workers=1) as executor:
                future = executor.submit(generator.build_individual_event,
                                         ("parallel", fillers(8), "smart", 1, 5, 100, blocking_queue))
                try:
                    message = messages.get(timeout=10)
                    self.assertIn("placing parallel: attempt=1/5", message)
                    self.assertFalse(future.done())
                    output = io.StringIO()
                    messages.put(message)
                    messages.put(None)
                    with contextlib.redirect_stderr(output):
                        generator.display_placement_progress(messages)
                    self.assertIn(message, output.getvalue())
                finally:
                    release.set()
                self.assertIsNone(future.result(timeout=10)[-1])

    def test_cli_serial_and_parallel_outputs_match(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            source = path / "input.csv"
            with source.open("w", newline="") as output:
                writer = csv.writer(output)
                writer.writerow(["id", "group_id", "name", "hokei_man_player_id", "zissen_man_player_id"])
                writer.writerows([[i, i, "Test", i, i] for i in range(1, 9)])
            contents = []
            for jobs in (1, 2):
                run = path / str(jobs)
                run.mkdir()
                result = subprocess.run(
                    [sys.executable, "-B", str(ROOT / "scripts/generate_tournament_csv.py"), "test",
                     "--source-csv", str(source), "--seed", "1", "--jobs", str(jobs)],
                    cwd=run, capture_output=True, text=True, timeout=20,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertIn("placing hokei_man: attempt=1/100", result.stderr)
                self.assertIn("placing zissen_man: attempt=1/100", result.stderr)
                contents.append({str(f.relative_to(run)): f.read_bytes() for f in run.rglob("*.csv")})
            self.assertEqual(*contents)


if __name__ == "__main__":
    unittest.main()
