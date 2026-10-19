"""Constraint, priority, reproducibility and CSV integration regressions."""

from collections import Counter
import contextlib
import csv
import io
import itertools
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from generate import generate, legacy, parse_args, publish
from placement import optimize, PlacementError, QUARTER_NAMES, visual_quarter


def players(count):
    return [
        dict(player_id=str(i + 1), group_id=f"g{i}", rank_total="", rank_group="")
        for i in range(count)
    ]


def values(result):
    return {stage["name"]: stage["value"] for stage in result.report["stages"]}


class PlacementTests(unittest.TestCase):
    def assert_valid(self, entrants, result):
        slots = result.slots
        self.assertCountEqual(
            [p for p in slots if p], [p["player_id"] for p in entrants]
        )
        self.assertTrue(all(slots[s] or slots[s + 1] for s in range(0, len(slots), 2)))
        counts = result.report["quarter_counts"].values()
        self.assertLessEqual(max(counts) - min(counts), 1)
        for group, count in Counter(
            p["group_id"] for p in entrants if p["group_id"]
        ).items():
            if count == 2:
                members = [p["player_id"] for p in entrants if p["group_id"] == group]
                self.assertEqual(
                    sum(slots.index(p) < len(slots) // 2 for p in members), 1
                )
        self.assertTrue(all(s["status"] == "OPTIMAL" for s in result.report["stages"]))

    def test_small_non_power_of_two_and_80_players(self):
        for count in (2, 3, 10, 30, 50, 80):
            with self.subTest(count=count):
                entrants = players(count)
                for i, p in enumerate(entrants):
                    p["group_id"] = f"g{i // 5}"
                result = optimize(entrants)
                self.assert_valid(entrants, result)

    def test_visual_top_four_and_hierarchical_spread(self):
        entrants = players(16)
        for i, p in enumerate(entrants):
            p["rank_total"] = str(i + 1)
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        for player, quarter in zip(
            ("1", "2", "3", "4"),
            ("left_top", "right_bottom", "right_top", "left_bottom"),
        ):
            self.assertEqual(
                QUARTER_NAMES[visual_quarter(result.slots.index(player), 16)], quarter
            )
        self.assertEqual(len({result.slots.index(str(i)) // 2 for i in range(1, 9)}), 8)
        self.assertTrue(all(value == 0 for value in values(result).values()))

    def test_exact_seed_edges_with_and_without_byes(self):
        for count in (8, 10, 16, 27):
            with self.subTest(count=count):
                entrants = players(count)
                for i in range(8):
                    entrants[i]["rank_total"] = str(i + 1)
                # The requested edge positions also apply with the optional
                # deeper hierarchical objective disabled.
                result = optimize(entrants, hierarchical=False)
                self.assert_valid(entrants, result)
                size = len(result.slots)
                half, block = size // 2, size // 4
                # Independent visual ordering: left top-to-bottom, followed
                # by right top-to-bottom (reversed in the internal tree).
                visual = result.slots[:half] + result.slots[half:][::-1]
                expected = {
                    "1": 0,
                    "2": size - 1,
                    "3": half,
                    "4": half - 1,
                    "5": block,
                    "6": half + block - 1,
                    "7": half + block,
                    "8": block - 1,
                }
                for player, index in expected.items():
                    self.assertEqual(visual[index], player)
                self.assertEqual(values(result)["global_rank_5_8_seed_position"], 0)
                # Each top seed meets its paired lower seed in the quarter's
                # final, after traversing opposite child subtrees.
                for high, low in (("1", "8"), ("2", "7"), ("3", "6"), ("4", "5")):
                    a, b = result.slots.index(high), result.slots.index(low)
                    self.assertEqual((a ^ b).bit_length(), block.bit_length() - 1)

    def test_top_eight_teammates_swap_even_when_group_counts_allow_pairing(self):
        entrants = players(16)
        for i in range(8):
            entrants[i]["rank_total"] = str(i + 1)
        # Five teammates may have a perfectly balanced 2/1/1/1 distribution
        # even with rank 1 and rank 8 together. The new objective must separate
        # those two, not merely balance the organization's overall headcount.
        for i in (0, 7, 8, 9, 10):
            entrants[i]["group_id"] = "A"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(result.slots[0], "1")
        self.assertNotEqual(visual_quarter(result.slots.index("8"), 16), 0)
        self.assertEqual(len({result.slots.index(str(i)) // 4 for i in range(5, 9)}), 4)
        self.assertTrue(
            all(result.slots.index(str(i)) in (3, 4, 11, 12) for i in range(5, 9))
        )
        scores = values(result)
        self.assertEqual(scores["organization_balance"], 0)
        self.assertEqual(scores["top8_same_group_quarter"], 0)
        self.assertEqual(scores["global_rank_5_8_direction"], 2)
        self.assertEqual(scores["global_rank_5_8_seed_position"], 0)

    def test_unavoidable_top_eight_group_conflict_is_soft(self):
        entrants = players(16)
        for i in range(8):
            entrants[i]["rank_total"] = str(i + 1)
        for i in range(5):
            entrants[i]["group_id"] = "A"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(values(result)["top8_same_group_quarter"], 1)
        self.assertEqual(values(result)["global_rank_5_8_seed_position"], 0)

    def test_group_first_round_preserved_with_seed_constraints(self):
        entrants = players(6)
        entrants[0].update(rank_total="1", group_id="A")
        entrants[1].update(rank_total="8", group_id="A")
        entrants[2].update(rank_total="6", group_id="A")
        for i in range(3, 6):
            entrants[i]["group_id"] = "B"
        # With 8 slots each quarter is a single match. Three A members can
        # use three quarters, so no first-round collision is necessary.
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(result.slots[0], "1")
        self.assertEqual(values(result)["same_group_first_round"], 0)

    def test_duplicate_lower_seeds_relax_exact_positions(self):
        entrants = players(16)
        for i in range(4):
            entrants[i]["rank_total"] = str(i + 1)
        for i in range(4, 9):
            entrants[i]["rank_total"] = "5"
        # Five lower seeds can occupy only four opposite-edge slots. This
        # remains feasible, with exactly one position preference relaxed.
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(values(result)["global_rank_5_8_spread"], 0)
        self.assertEqual(values(result)["global_rank_5_8_seed_position"], 1)

    def test_small_draw_top_four_corners_and_rank_gaps(self):
        for count, ranks, expected in ((2, (1, 2), (0, 1)), (3, (1, 2, 4), (0, 2, 1))):
            entrants = players(count)
            for p, rank in zip(entrants, ranks):
                p["rank_total"] = str(rank)
            result = optimize(entrants)
            self.assert_valid(entrants, result)
            self.assertEqual(
                tuple(result.slots.index(p["player_id"]) for p in entrants), expected
            )

    def test_two_member_separation_overrides_rank_eight_direction(self):
        entrants = players(16)
        for i, p in enumerate(entrants):
            p["rank_total"] = str(i + 1)
        entrants[0]["group_id"] = entrants[7]["group_id"] = "A"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertGreaterEqual(result.slots.index("8"), 8)
        self.assertEqual(values(result)["global_rank_5_8_spread"], 0)
        self.assertEqual(values(result)["global_rank_5_8_direction"], 2)

    def test_impossible_hard_constraints_are_not_relaxed(self):
        entrants = players(8)
        entrants[0].update(group_id="A", rank_total="1")
        entrants[1].update(group_id="A", rank_total="4")
        with self.assertRaisesRegex(PlacementError, "INFEASIBLE"):
            optimize(entrants)

    def test_lexicographic_optimum_matches_exhaustive_small_draw(self):
        entrants = players(6)
        for i, p in enumerate(entrants):
            p["group_id"] = "A" if i < 4 else "B"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        # Independently enumerate all placements (including both BYEs), then
        # compare the actual optimum tuple rather than model helper variables.
        scores = []
        for positions in itertools.permutations(range(8), 6):
            occupied = set(positions)
            if any(s not in occupied and s + 1 not in occupied for s in range(0, 8, 2)):
                continue
            counts = Counter(s // 2 for s in positions)
            if any(not 1 <= counts[q] <= 2 for q in range(4)):
                continue
            if (positions[4] < 4) == (positions[5] < 4):
                continue
            org = 0
            first = 0
            for members in (positions[:4], positions[4:]):
                distribution = Counter(s // 2 for s in members)
                lo, hi = len(members) // 4, (len(members) + 3) // 4
                org += sum(
                    max(0, distribution[q] - hi) + max(0, lo - distribution[q])
                    for q in range(4)
                )
                first += sum(distribution[q] == 2 for q in range(4))
            scores.append((org, first))
        actual = values(result)
        self.assertEqual(
            (actual["organization_balance"], actual["same_group_first_round"]),
            min(scores),
        )

    def test_unavoidable_first_round_collisions_are_reported(self):
        entrants = players(8)
        for i, p in enumerate(entrants):
            p["group_id"] = "A" if i < 6 else "B"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(values(result)["organization_balance"], 0)
        self.assertEqual(values(result)["same_group_first_round"], 2)

    def test_seed_reproduces_and_changes_ties(self):
        entrants = players(10)
        first = optimize(entrants, seed=1)
        repeated = optimize(entrants, seed=1)
        other = optimize(entrants, seed=2)
        self.assertEqual(first, repeated)
        self.assertNotEqual(first.slots, other.slots)
        self.assertEqual(values(first), values(other))

    def test_gaps_local_ranks_and_lastyear_metadata(self):
        entrants = players(16)
        for i, p in enumerate(entrants[:8]):
            p.update(group_id="A", rank_group=str(i + 1))
        entrants[8]["rank_total"] = "8"
        # Lastyear does not create a second rank 1 or enter the sporting model.
        entrants[9]["rank_lastyear"] = "1"
        entrants[10]["rank_total"] = "1"
        result = optimize(entrants, hierarchical=False)
        self.assertEqual(visual_quarter(result.slots.index("9"), 16), 0)
        for band in (range(1, 5), range(5, 9)):
            self.assertEqual(
                len({visual_quarter(result.slots.index(str(i)), 16) for i in band}), 4
            )
        self.assertFalse(any(stage.startswith("top_") for stage in values(result)))

    def test_duplicate_ids_and_top_ranks_rejected(self):
        entrants = players(4)
        entrants[1]["player_id"] = "1"
        with self.assertRaisesRegex(PlacementError, "unique"):
            optimize(entrants)
        entrants = players(4)
        entrants[0]["rank_total"] = entrants[1]["rank_total"] = "1"
        with self.assertRaisesRegex(PlacementError, "duplicate rank_total"):
            optimize(entrants)

    def test_timeout_is_not_misreported_as_infeasible(self):
        with self.assertRaisesRegex(PlacementError, "UNKNOWN.*increase --time-limit"):
            optimize(players(16), time_limit=0.000001)

    def test_same_local_ranks_spread_across_organizations(self):
        entrants = players(16)
        for i, p in enumerate(entrants):
            p.update(group_id=f"group{i // 2}", rank_group=str(i % 2 + 1))
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        for rank in ("1", "2"):
            ids = [p["player_id"] for p in entrants if p["rank_group"] == rank]
            self.assertEqual(
                Counter(result.slots.index(p) // 4 for p in ids),
                Counter({0: 2, 1: 2, 2: 2, 3: 2}),
            )
        by_id = {p["player_id"]: p for p in entrants}
        for s in range(0, 16, 2):
            self.assertNotEqual(
                by_id[result.slots[s]]["rank_group"],
                by_id[result.slots[s + 1]]["rank_group"],
            )
        self.assertEqual(values(result)["same_local_rank_quarter_balance"], 0)
        self.assertEqual(values(result)["same_local_rank_first_round"], 0)
        self.assertFalse(any(name.endswith("_non_bye") for name in values(result)))

    def test_local_rank_byes_prioritize_higher_ranks_and_preserve_seed_corners(self):
        entrants = players(10)
        for i, p in enumerate(entrants):
            p["rank_group"] = str(1 if i < 4 else 2 if i < 8 else 3)
        for i in range(4):
            entrants[i]["rank_total"] = str(i + 1)
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(
            [result.slots.index(str(i)) for i in range(1, 5)], [0, 8, 15, 7]
        )
        by_id = {p["player_id"]: p for p in entrants}
        byes = Counter(
            by_id[p]["rank_group"]
            for s, p in enumerate(result.slots)
            if p and not result.slots[s ^ 1]
        )
        self.assertEqual(byes, Counter({"1": 4, "2": 2}))
        self.assertEqual(values(result)["same_local_rank_first_round"], 0)
        summary = result.report["local_rank_summary"]
        self.assertEqual([summary[r]["byes"] for r in ("1", "2", "3")], [4, 2, 0])

    def test_global_seed_distribution_overrides_local_rank_balance(self):
        entrants = players(16)
        for i in range(8):
            entrants[i]["rank_total"] = str(i + 1)
        entrants[0]["rank_group"] = entrants[7]["rank_group"] = "1"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(result.slots[0], "1")
        self.assertEqual(result.slots[3], "8")
        self.assertEqual(values(result)["global_rank_5_8_direction"], 0)
        self.assertEqual(values(result)["global_rank_5_8_seed_position"], 0)
        self.assertEqual(values(result)["same_local_rank_quarter_balance"], 1)

    def test_unavoidable_same_local_rank_matches_are_soft(self):
        entrants = players(8)
        for p in entrants:
            p["rank_group"] = "1"
        result = optimize(entrants)
        self.assert_valid(entrants, result)
        self.assertEqual(values(result)["same_local_rank_first_round"], 4)
        self.assertEqual(
            result.report["local_rank_summary"]["1"]["first_round_matches"], 4
        )

    def test_rank_gaps_and_unknown_ranks_do_not_form_false_collisions(self):
        entrants = players(6)
        for p, rank in zip(entrants, ("1", "1", "4", "4", "", "0")):
            p["rank_group"] = rank
        first = optimize(entrants, seed=1)
        self.assertEqual(first, optimize(entrants, seed=1))
        self.assertEqual(values(first)["local_rank_1_non_bye"], 0)
        self.assertEqual(values(first)["local_rank_4_non_bye"], 2)
        self.assertNotIn("local_rank_0_non_bye", values(first))
        self.assertEqual(first.report["local_rank_summary"]["unranked"]["non_bye"], 2)
        unknown = optimize(players(8))
        self.assertNotIn("same_local_rank_first_round", values(unknown))
        self.assertEqual(
            unknown.report["local_rank_summary"]["unranked"]["first_round_matches"], 0
        )

    def test_new_objectives_match_exhaustive_draw_with_bye_tradeoff(self):
        entrants = players(6)
        local_ranks = (1, 1, 2, 2, 2, 3)
        for p, rank in zip(entrants, local_ranks):
            p["rank_group"] = str(rank)
        result = optimize(entrants)
        best = None
        for positions in itertools.permutations(range(8), 6):
            occupied = dict(zip(positions, local_ranks))
            quarter_counts = Counter(s // 2 for s in positions)
            if any(not 1 <= quarter_counts[q] <= 2 for q in range(4)):
                continue
            spread = 0
            for rank in (1, 2, 3):
                counts = Counter(s // 2 for s, r in occupied.items() if r == rank)
                spread += sum(max(0, counts[q] - 1) for q in range(4))
            clashes = sum(
                s in occupied and s + 1 in occupied and occupied[s] == occupied[s + 1]
                for s in range(0, 8, 2)
            )
            non_bye = tuple(
                sum(r == rank and s ^ 1 in occupied for s, r in occupied.items())
                for rank in (1, 2, 3)
            )
            score = (spread, clashes, *non_bye)
            best = score if best is None else min(best, score)
        actual = values(result)
        score = (
            actual["same_local_rank_quarter_balance"],
            actual["same_local_rank_first_round"],
            *(actual[f"local_rank_{rank}_non_bye"] for rank in (1, 2, 3)),
        )
        self.assertEqual(score, best)
        # Two BYEs exist, but giving both to rank 1 forces a rank-2 clash.
        # Keeping first-round matches rank-diverse takes priority.
        self.assertEqual(score, (0, 0, 1, 2, 1))


class OutputTests(unittest.TestCase):
    def test_group_output_columns(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for event, expected in (
                ("tenkai_man", legacy.TENKAI_HEADER),
                ("tenkai_woman", legacy.TENKAI_HEADER),
                ("dantai_hokei_man", legacy.DANTAI_HOKEI_HEADER),
                ("dantai_hokei_woman", legacy.DANTAI_HOKEI_HEADER),
            ):
                path = root / f"{event}.csv"
                legacy.write_group_table_csv(event, ["1", "2"], path)
                fields, _ = legacy.read_players_table(path)
                self.assertEqual(fields, expected)
                sql = "\n".join(legacy.group_table_sql_lines(event))
                for field in expected:
                    self.assertIn(f"{field} ", sql)

            sql_path = root / "generate_tables.sql"
            legacy.write_original_generate_tables_sql(
                ["hokei_man", "zissen_woman"],
                sql_path,
                ["dantai_zissen_man", "tenkai_man", "tenkai_woman", "dantai_hokei_man"],
            )
            sql = sql_path.read_text(encoding="utf-8")
            for event in ("tenkai_man", "tenkai_woman"):
                self.assertIn("\n".join(legacy.group_table_sql_lines(event)), sql)
            self.assertIn("\n".join(legacy.group_tournament_sql_lines("dantai_zissen_man")), sql)
            self.assertIn("\n".join(legacy.group_table_sql_lines("dantai_hokei_man")), sql)

    def test_default_publication_does_not_create_backups(self):
        args = parse_args(["example", "--source-csv", "input.csv"])
        self.assertFalse(args.backup)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            staging, destination = root / "staging", root / "output"
            staging.mkdir()
            destination.mkdir()
            (staging / "draw.csv").write_text("new")
            (destination / "draw.csv").write_text("old")
            (destination / "title.txt").write_text("preserve")
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertIsNone(publish(staging, destination))
            self.assertEqual((destination / "draw.csv").read_text(), "new")
            self.assertEqual((destination / "title.txt").read_text(), "preserve")
            self.assertFalse((destination / "generation_backups").exists())

    def test_source_roundtrip_teams_sql_backup_and_failure_preservation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "input.csv"
            fields = [
                "id",
                "group_id",
                "name",
                "name_kana",
                "mvp",
                "high_school_hokei_man_player_id",
                "high_school_hokei_man_rank_total",
                "high_school_hokei_man_comment",
                "dantai_zissen_man_player_id",
                "dantai_zissen_man_rank_group",
                "tenkai_player_id",
                "tenkai_rank_group",
            ]
            with source.open("w", encoding="utf-8-sig", newline="") as output:
                writer = csv.DictWriter(output, fieldnames=fields)
                writer.writeheader()
                for i in range(4):
                    writer.writerow(
                        dict(
                            zip(
                                fields,
                                [
                                    str(i + 1),
                                    str(i + 1),
                                    f"選手{i}",
                                    "かな",
                                    "",
                                    str(i + 1),
                                    str(i + 1),
                                    "改行\nコメント",
                                    str(i + 1),
                                    "A",
                                    str(i + 1),
                                    "A",
                                ],
                            )
                        )
                    )
            args = parse_args(
                ["example", "--source-csv", str(source), "--seed", "1", "--backup"]
            )
            destination = root / "data" / "example"
            original = destination / "original" / "hokei_man.csv"
            original.parent.mkdir(parents=True)
            original.write_text("old user data", encoding="utf-8")
            unrelated = destination / "title.txt"
            unrelated.write_text("preserve", encoding="utf-8")
            with (
                contextlib.redirect_stdout(io.StringIO()),
                contextlib.redirect_stderr(io.StringIO()),
            ):
                report = generate(args, data_root=root / "data")
            self.assertEqual(len(report["events"]), 3)
            backup = list(
                destination.glob("generation_backups/*/original/hokei_man.csv")
            )
            self.assertEqual(len(backup), 1)
            self.assertEqual(backup[0].read_text(), "old user data")
            self.assertEqual(unrelated.read_text(), "preserve")
            with original.open() as output:
                reader = csv.DictReader(output)
                self.assertEqual(reader.fieldnames, legacy.HEADER)
                games = list(reader)
            self.assertEqual([row["id"] for row in games], ["1", "2", "3", "4"])
            self.assertEqual(games[-2]["left_player_id"], "")
            self.assertCountEqual(
                [
                    row[side]
                    for row in games
                    for side in ("left_player_id", "right_player_id")
                    if row[side]
                ],
                ["1", "2", "3", "4"],
            )
            output_fields, output_rows = legacy.read_players_table(
                destination / "static" / "players.csv"
            )
            self.assertIn("hokei_man_player_id", output_fields)
            self.assertEqual(output_rows[0]["hokei_man_comment"], "改行\nコメント")
            self.assertIn(
                "create table dantai_zissen_man",
                (destination / "original" / "generate_tables.sql").read_text(),
            )
            self.assertEqual(
                len(
                    legacy.read_players_table(destination / "original" / "tenkai.csv")[
                        1
                    ]
                ),
                8,
            )
            snapshot = {
                p.relative_to(destination): p.read_bytes()
                for p in destination.rglob("*")
                if p.is_file()
            }
            with (
                patch("generate.optimize", side_effect=PlacementError("UNKNOWN")),
                contextlib.redirect_stdout(io.StringIO()),
            ):
                with self.assertRaisesRegex(ValueError, "hokei_man: UNKNOWN"):
                    generate(args, data_root=root / "data")
            self.assertEqual(
                snapshot,
                {
                    p.relative_to(destination): p.read_bytes()
                    for p in destination.rglob("*")
                    if p.is_file()
                },
            )


if __name__ == "__main__":
    unittest.main()
