from dataclasses import dataclass
from dataclasses import replace
import random
import sys
import time


@dataclass
class TournamentSlot:
    index: int
    seed: int
    opponent_index: int
    visual_half: str
    visual_vertical: str
    visual_quarter: str
    player_id: str = ""
    occupied: bool = True


@dataclass
class PlacementPlayer:
    player_id: str
    group_id: str = ""
    rank_group: str = ""
    rank_lastyear: str = ""
    rank_total: str = ""


class PlacementStrategy:
    def build_slot_players(self, players):
        raise NotImplementedError


class PlacementSearchLimitExceeded(ValueError):
    pass


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


def build_slots(player_count):
    slot_count = next_power_of_two(player_count)
    seeds = seed_order(slot_count)
    return [
        TournamentSlot(
            index=index,
            seed=seed,
            opponent_index=index + 1 if index % 2 == 0 else index - 1,
            visual_half=visual_half_for_index(index, slot_count),
            visual_vertical=visual_vertical_for_index(index, slot_count),
            visual_quarter=visual_quarter_for_index(index, slot_count),
        )
        for index, seed in enumerate(seeds)
    ]


def visual_quarter_for_index(index, slot_count):
    quarter = index * 4 // slot_count
    if quarter == 0:
        return "left_top"
    if quarter == 1:
        return "left_bottom"
    if quarter == 2:
        return "right_bottom"
    return "right_top"


def visual_half_for_index(index, slot_count):
    return "left" if visual_quarter_for_index(index, slot_count).startswith("left_") else "right"


def visual_vertical_for_index(index, slot_count):
    return "top" if visual_quarter_for_index(index, slot_count).endswith("_top") else "bottom"


def apply_byes(slots, player_count):
    bye_count = len(slots) - player_count
    seed_to_index = {slot.seed: slot.index for slot in slots}

    for seed in range(1, bye_count + 1):
        seed_index = seed_to_index[seed]
        slots[slots[seed_index].opponent_index].occupied = False


def assign_players_to_slots(slots, player_ids):
    assigned_players = iter(player_ids)
    for slot in slots:
        if slot.occupied:
            slot.player_id = next(assigned_players)
        else:
            slot.player_id = ""
    return slots


def assign_players_to_open_slots(slots, player_ids):
    assigned_players = iter(player_ids)
    for slot in slots:
        if slot.occupied and not slot.player_id:
            slot.player_id = next(assigned_players)
    return slots


def slot_player_ids(slots):
    return [slot.player_id for slot in slots]


def build_slot_players_from_ordered_ids(player_ids):
    slots = build_slots(len(player_ids))
    apply_byes(slots, len(player_ids))
    assign_players_to_slots(slots, player_ids)
    return slot_player_ids(slots)


class RandomPlacementStrategy(PlacementStrategy):
    def __init__(self, rng=None):
        self.rng = rng or random.Random()

    def build_slot_players(self, players):
        shuffled_player_ids = [player_id_from_entry(player) for player in players]
        self.rng.shuffle(shuffled_player_ids)
        return build_slot_players_from_ordered_ids(shuffled_player_ids)


class SmartSeedPlacementStrategy(PlacementStrategy):
    RANK_FIELDS = ("rank_total", "rank_lastyear", "rank_group")
    # Coordinates use bit 1 for right and bit 0 for bottom. XOR reflects
    # a whole group's layout without changing the relationships between ranks.
    QUARTERS = ("left_top", "left_bottom", "right_top", "right_bottom")
    GROUP_RANK_QUARTERS = (0, 3, 2, 1)
    RELAX_ORDER = (
        "same_rank_first_round",
        "same_group_rank_1_4_quarter",
        "same_group_quarter",
        "same_group_first_round",
    )

    def __init__(
        self,
        rng=None,
        max_seed=8,
        seed=None,
        max_attempts=100,
        max_search_nodes=1000,
        progress_label="",
        progress_callback=None,
    ):
        self.rng = rng or random.Random()
        self.max_seed = max_seed
        self.seed = seed
        self.max_attempts = max_attempts
        self.max_search_nodes = max_search_nodes
        self.progress_label = progress_label
        self.progress_callback = progress_callback
        self.search_nodes = 0
        self.relaxed_constraints = set()
        self.group_seed_preferences = {}
        self.started_at = time.monotonic()
        self.last_progress_at = self.started_at
        self.attempt_number = 0
        self.attempt_limit = 0
        self.phase = "seeds"

    def report_progress(self, status="running", force=False):
        if not self.progress_label:
            return
        now = time.monotonic()
        if not force and now - self.last_progress_at < 1:
            return
        self.last_progress_at = now
        relaxed = ",".join(name for name in self.RELAX_ORDER if name in self.relaxed_constraints) or "none"
        message = (
            f"placing {self.progress_label}: attempt={self.attempt_number}/{self.attempt_limit} "
            f"phase={self.phase} nodes={self.search_nodes}/{self.max_search_nodes} "
            f"elapsed={now - self.started_at:.1f}s relaxed={relaxed} {status}"
        )
        if self.progress_callback is not None:
            self.progress_callback(message)
        else:
            print(message, file=sys.stderr, flush=True)

    def build_slot_players(self, players):
        last_error = None
        relax_steps = range(len(self.RELAX_ORDER) + 1)
        attempts_per_step = max(1, self.max_attempts // len(list(relax_steps)))
        self.started_at = time.monotonic()
        self.attempt_limit = attempts_per_step * len(relax_steps)
        for relax_count in relax_steps:
            self.relaxed_constraints = set(self.RELAX_ORDER[:relax_count])
            for attempt in range(attempts_per_step):
                self.attempt_number = relax_count * attempts_per_step + attempt + 1
                if self.seed is None:
                    self.rng = random.Random(self.rng.random())
                else:
                    self.rng = random.Random(self.seed + relax_count * attempts_per_step + attempt)
                self.search_nodes = 0
                self.phase = "seeds"
                self.report_progress("started", force=True)
                try:
                    result = self.build_slot_players_once(players)
                    self.report_progress("success", force=True)
                    return result
                except ValueError as e:
                    last_error = e
                    self.report_progress(f"failed: {e}", force=True)
        raise ValueError(
            f"could not place players after {self.attempt_limit} attempts: {last_error}"
        ) from last_error

    def build_slot_players_once(self, players):
        placement_players = [placement_player_from_entry(player) for player in players]
        slots = build_slots(len(placement_players))
        apply_byes(slots, len(placement_players))

        seeded_players = self.seeded_players(placement_players)
        # Overall/recommendation seeds are fixed. Group-only seeds are slot
        # preferences: fixing those blindly can make the four-quarter rule
        # impossible (e.g. a recommendation plus group ranks 1 through 4).
        self.group_seed_preferences = {
            player.player_id: seed
            for seed, player in enumerate(seeded_players, start=1)
            if self.is_group_only_seed(player)
        }
        seeded_players = [player for player in seeded_players if not self.is_group_only_seed(player)]
        seeded_players = self.reorder_tied_seed_players(
            slots,
            placement_players,
            seeded_players,
        )
        seed_to_slot = {slot.seed: slot for slot in slots}
        seeded_player_ids = set()

        for seed, player in enumerate(seeded_players, start=1):
            if seed > self.max_seed or seed not in seed_to_slot:
                break
            seed_to_slot[seed].player_id = player.player_id
            seeded_player_ids.add(player.player_id)

        if not self.is_group_rank_placement_valid(slots, {p.player_id: p for p in placement_players}):
            raise ValueError("fixed seeds conflict with group-rank quarter placement")

        remaining_players = [
            player
            for player in placement_players
            if player.player_id not in seeded_player_ids
        ]
        self.place_remaining_players(slots, placement_players, remaining_players)
        return slot_player_ids(slots)

    def is_group_only_seed(self, player):
        return (
            "rank_group" in self.RANK_FIELDS
            and rank_value(player.rank_total) is None
            and rank_value(player.rank_lastyear) is None
        )

    def seeded_players(self, players):
        seeded_players = []
        seeded_player_ids = set()
        for rank_field in self.RANK_FIELDS:
            ranked_players = [
                player
                for player in players
                if player.player_id not in seeded_player_ids
                and rank_value(getattr(player, rank_field)) is not None
            ]
            self.rng.shuffle(ranked_players)
            for player in sorted(
                ranked_players,
                key=lambda player: rank_value(getattr(player, rank_field)),
            ):
                seeded_players.append(player)
                seeded_player_ids.add(player.player_id)
                if len(seeded_players) >= self.max_seed:
                    return seeded_players
        return seeded_players

    def reorder_tied_seed_players(self, slots, all_players, seeded_players):
        if len(seeded_players) <= 1:
            return seeded_players

        reordered_players = []
        seed_to_slot = {slot.seed: slot for slot in slots}
        player_by_id = {player.player_id: player for player in all_players}
        fixed_seeded_players = []
        start = 0

        while start < len(seeded_players):
            end = start + 1
            seed_key = self.seed_priority_key(seeded_players[start])
            while end < len(seeded_players) and self.seed_priority_key(seeded_players[end]) == seed_key:
                end += 1

            group_players = seeded_players[start:end]
            seed_numbers = list(range(start + 1, end + 1))
            reordered_group = self.best_seed_order_for_tied_players(
                slots,
                seed_to_slot,
                player_by_id,
                all_players,
                fixed_seeded_players,
                group_players,
                seed_numbers,
                seeded_players[end:],
                end + 1,
            )
            reordered_players.extend(reordered_group)
            fixed_seeded_players.extend(reordered_group)
            start = end

        return reordered_players

    def seed_priority_key(self, player):
        for rank_index, rank_field in enumerate(self.RANK_FIELDS):
            value = rank_value(getattr(player, rank_field))
            if value is not None:
                return (rank_index, value)
        return (len(self.RANK_FIELDS), self.max_seed + 1)

    def best_seed_order_for_tied_players(
        self,
        slots,
        seed_to_slot,
        player_by_id,
        all_players,
        fixed_seeded_players,
        group_players,
        seed_numbers,
        future_seeded_players,
        future_start_seed,
    ):
        if len(group_players) <= 1:
            return group_players

        fixed_seeded_ids = {player.player_id for player in fixed_seeded_players}
        group_seeded_ids = {player.player_id for player in group_players}
        future_seeded_ids = {player.player_id for player in future_seeded_players}
        remaining_players = [
            player
            for player in all_players
            if player.player_id not in fixed_seeded_ids
            and player.player_id not in group_seeded_ids
            and player.player_id not in future_seeded_ids
        ]

        ordered_players = []
        unordered_players = list(group_players)
        for current_index, seed in enumerate(seed_numbers):
            best_player = None
            best_score = None
            for player in unordered_players:
                trial_order = ordered_players + [player] + [
                    candidate
                    for candidate in unordered_players
                    if candidate.player_id != player.player_id
                ]
                score = self.seed_order_score(
                    slots,
                    player_by_id,
                    fixed_seeded_players,
                    trial_order,
                    seed_numbers,
                    future_seeded_players,
                    future_start_seed,
                    remaining_players,
                )
                if best_score is None or score < best_score:
                    best_score = score
                    best_player = player
            ordered_players.append(best_player)
            unordered_players = [
                player
                for player in unordered_players
                if player.player_id != best_player.player_id
            ]

        return ordered_players

    def seed_order_score(
        self,
        slots,
        player_by_id,
        fixed_seeded_players,
        group_players,
        seed_numbers,
        future_seeded_players,
        future_start_seed,
        remaining_players,
    ):
        self.report_progress()
        trial_slots = [replace(slot) for slot in slots]
        trial_by_seed = {slot.seed: slot for slot in trial_slots}
        for seed, player in enumerate(fixed_seeded_players, start=1):
            if seed in trial_by_seed:
                trial_by_seed[seed].player_id = player.player_id
        for seed, player in zip(seed_numbers, group_players):
            if seed in trial_by_seed:
                trial_by_seed[seed].player_id = player.player_id
        for seed, player in enumerate(future_seeded_players, start=future_start_seed):
            if seed in trial_by_seed:
                trial_by_seed[seed].player_id = player.player_id

        if not self.is_group_rank_placement_valid(trial_slots, player_by_id):
            return (len(player_by_id) + 1, 0, 0)

        # Tied seed candidates have equal rank priority. Choose the order
        # that leaves the most legal slots for non-seeded teammates.
        candidate_counts = [
            len(self.hard_constraint_slots(trial_slots, player_by_id, player))
            for player in remaining_players
        ]
        unmatched_count = self.unmatched_player_count(
            trial_slots,
            player_by_id,
            remaining_players,
        )
        zero_count = sum(1 for count in candidate_counts if count == 0)
        total_count = sum(candidate_counts)
        return (unmatched_count, zero_count, -total_count)

    def unmatched_player_count(self, slots, player_by_id, players):
        slot_indexes = [
            slot.index
            for slot in slots
            if slot.occupied and not slot.player_id
        ]
        edges = {
            player.player_id: [
                slot.index
                for slot in self.hard_constraint_slots(slots, player_by_id, player)
            ]
            for player in players
        }
        matched_players = self.maximum_bipartite_matching_size(
            [player.player_id for player in players],
            slot_indexes,
            edges,
        )
        return len(players) - matched_players

    def maximum_bipartite_matching_size(self, player_ids, slot_indexes, edges):
        matched_player_by_slot = {}

        def assign(player_id, seen_slots):
            for slot_index in edges[player_id]:
                if slot_index in seen_slots:
                    continue
                seen_slots.add(slot_index)
                if slot_index not in matched_player_by_slot or assign(
                    matched_player_by_slot[slot_index],
                    seen_slots,
                ):
                    matched_player_by_slot[slot_index] = player_id
                    return True
            return False

        return sum(
            1
            for player_id in player_ids
            if assign(player_id, set())
        )

    def place_remaining_players(self, slots, all_players, remaining_players):
        player_by_id = {player.player_id: player for player in all_players}
        self.rng.shuffle(remaining_players)
        self.phase = "search"
        self.report_progress("started", force=True)

        solved_slots = self.solve_players_backtracking(slots, player_by_id, list(remaining_players))
        if not solved_slots:
            raise ValueError("could not place remaining players without breaking group constraints")
        for index, solved_slot in enumerate(solved_slots):
            slots[index].player_id = solved_slot.player_id

    def solve_players_backtracking(self, slots, player_by_id, remaining_players):
        self.search_nodes += 1
        self.report_progress()
        if self.search_nodes > self.max_search_nodes:
            raise PlacementSearchLimitExceeded(
                f"placement search exceeded {self.max_search_nodes} nodes"
            )

        if not remaining_players:
            return slots if self.is_complete_placement_valid(slots, player_by_id) else None

        player = min(
            remaining_players,
            key=lambda player: (
                self.remaining_priority(slots, player_by_id, player),
                len(self.hard_constraint_slots(slots, player_by_id, player)),
                self.rng.random(),
            ),
        )
        candidate_slots = self.hard_constraint_slots(slots, player_by_id, player)
        if not candidate_slots:
            return None

        self.rng.shuffle(candidate_slots)
        candidate_slots = sorted(
            candidate_slots,
            key=lambda slot: (
                slot.seed != self.group_seed_preferences.get(player.player_id),
                self.balance_score(slots, player_by_id, player, slot),
            ),
        )

        next_remaining_players = [
            remaining_player
            for remaining_player in remaining_players
            if remaining_player.player_id != player.player_id
        ]
        for slot in candidate_slots:
            trial_slots = [replace(candidate) for candidate in slots]
            trial_slots[slot.index].player_id = player.player_id
            solved_slots = self.solve_players_backtracking(
                trial_slots,
                player_by_id,
                next_remaining_players,
            )
            if solved_slots:
                return solved_slots
        return None

    def is_complete_placement_valid(self, slots, player_by_id):
        return self.is_group_rank_placement_valid(slots, player_by_id)

    def future_constraint_score(self, slots, player_by_id, remaining_players, player, slot):
        trial_slots = [replace(candidate) for candidate in slots]
        trial_slots[slot.index].player_id = player.player_id
        candidate_counts = [
            len(self.hard_constraint_slots(trial_slots, player_by_id, remaining_player))
            for remaining_player in remaining_players
            if remaining_player.player_id != player.player_id
        ]
        zero_count = sum(1 for count in candidate_counts if count == 0)
        return (zero_count, -sum(candidate_counts))

    def remaining_priority(self, slots, player_by_id, player):
        # Place constrained players first. This keeps later random fill from
        # consuming the few slots that satisfy recommendation/group-rank rules.
        return (
            0 if rank_value(player.rank_lastyear) is not None else 1,
            0 if rank_value(player.rank_group) in (1, 2, 3, 4) else 1,
        )

    def hard_constraint_slots(self, slots, player_by_id, player):
        candidate_slots = [
            slot
            for slot in slots
            if slot.occupied and not slot.player_id
        ]
        allowed_quarters = self.group_rank_quarters(slots, player_by_id, player)
        candidate_slots = [slot for slot in candidate_slots if slot.visual_quarter in allowed_quarters]
        if self.is_hard("same_group_first_round"):
            candidate_slots = [
                slot
                for slot in candidate_slots
                if not self.has_same_group_first_round_opponent(slots, player_by_id, player, slot)
            ]
        if self.is_hard("same_group_quarter"):
            candidate_slots = [
                slot
                for slot in candidate_slots
                if not self.has_same_group_quarter_conflict(slots, player_by_id, player, slot)
            ]
        if self.is_hard("same_group_rank_1_4_quarter"):
            candidate_slots = [
                slot
                for slot in candidate_slots
                if not self.has_same_group_rank_quarter_conflict(slots, player_by_id, player, slot)
            ]
        if self.is_hard("same_rank_first_round"):
            candidate_slots = [
                slot
                for slot in candidate_slots
                if not self.has_same_rank_first_round_opponent(slots, player_by_id, player, slot)
            ]
        return candidate_slots

    def is_hard(self, constraint_name):
        return constraint_name in self.RELAX_ORDER and constraint_name not in self.relaxed_constraints

    def has_same_group_first_round_opponent(self, slots, player_by_id, player, slot):
        if not player.group_id:
            return False

        opponent_player_id = slots[slot.opponent_index].player_id
        return (
            bool(opponent_player_id)
            and player_by_id[opponent_player_id].group_id == player.group_id
        )

    def has_same_group_quarter_conflict(self, slots, player_by_id, player, slot):
        if not player.group_id:
            return False
        return any(
            placed_slot.player_id
            and player_by_id[placed_slot.player_id].group_id == player.group_id
            and placed_slot.visual_quarter == slot.visual_quarter
            for placed_slot in slots
        )

    def has_same_group_rank_quarter_conflict(self, slots, player_by_id, player, slot):
        if not player.group_id or rank_value(player.rank_group) not in (1, 2, 3, 4):
            return False
        return any(
            placed_slot.player_id
            and player_by_id[placed_slot.player_id].group_id == player.group_id
            and rank_value(player_by_id[placed_slot.player_id].rank_group) in (1, 2, 3, 4)
            and placed_slot.visual_quarter == slot.visual_quarter
            for placed_slot in slots
        )

    def has_same_rank_first_round_opponent(self, slots, player_by_id, player, slot):
        rank_group = rank_value(player.rank_group)
        if rank_group is None:
            return False
        opponent_player_id = slots[slot.opponent_index].player_id
        return (
            bool(opponent_player_id)
            and rank_value(player_by_id[opponent_player_id].rank_group) == rank_group
        )

    def group_rank_patterns(self, slots, player_by_id, group_id):
        """Return reflected rank layouts compatible with already placed teammates.

        A recommendation anchors the layout: ranks 1/2 are on the opposite
        half, rank 3 is in the other quarter of its own half, and rank 4 shares
        its quarter. With multiple recommendations, fill their empty quarters
        first, keeping the highest-priority recommendation as the anchor.
        """
        teammates = [
            (slot, player_by_id[slot.player_id])
            for slot in slots
            if slot.player_id and player_by_id[slot.player_id].group_id == group_id
        ]
        recommendations = [
            player for player in player_by_id.values()
            if player.group_id == group_id and rank_value(player.rank_lastyear) is not None
        ]
        if recommendations:
            anchor = min(
                recommendations,
                key=lambda player: (self.seed_priority_key(player), player.player_id),
            )
            placed_recommendations = {
                player.player_id: slot.visual_quarter for slot, player in teammates
                if rank_value(player.rank_lastyear) is not None
            }
            occupied_quarters = set(placed_recommendations.values())
            unplaced_count = len(recommendations) - len(placed_recommendations)
            anchors = (
                [self.QUARTERS.index(placed_recommendations[anchor.player_id])]
                if anchor.player_id in placed_recommendations else range(4)
            )
            patterns = []
            for anchor_index in anchors:
                order = [self.QUARTERS[anchor_index ^ offset] for offset in (3, 2, 1, 0)]
                # An unseeded recommendation (outside the top max_seed) will
                # be placed before ordinary ranks. Keep its possible quarters
                # open when checking fixed seeds and scoring tied seed orders.
                for mask in range(1, 16):
                    eventual_quarters = {q for index, q in enumerate(self.QUARTERS) if mask & (1 << index)}
                    if (self.QUARTERS[anchor_index] not in eventual_quarters
                            or not occupied_quarters <= eventual_quarters
                            or len(eventual_quarters - occupied_quarters) > unplaced_count):
                        continue
                    patterns.append(
                        [q for q in order if q not in eventual_quarters]
                        + [q for q in order if q in eventual_quarters]
                    )
        else:
            patterns = [
                [self.QUARTERS[quarter ^ reflection] for quarter in self.GROUP_RANK_QUARTERS]
                for reflection in range(4)
            ]
        return [
            pattern for pattern in patterns
            if all(
                rank_value(player.rank_lastyear) is not None
                or rank_value(player.rank_group) not in (1, 2, 3, 4)
                or pattern[rank_value(player.rank_group) - 1] == slot.visual_quarter
                for slot, player in teammates
            )
        ]

    def group_rank_quarters(self, slots, player_by_id, player):
        rank = rank_value(player.rank_group)
        if not player.group_id or rank not in (1, 2, 3, 4) or rank_value(player.rank_lastyear) is not None:
            return set(self.QUARTERS)
        return {
            pattern[rank - 1]
            for pattern in self.group_rank_patterns(slots, player_by_id, player.group_id)
        }

    def is_group_rank_placement_valid(self, slots, player_by_id):
        group_ids = {
            player_by_id[slot.player_id].group_id
            for slot in slots if slot.player_id and player_by_id[slot.player_id].group_id
        }
        return all(self.group_rank_patterns(slots, player_by_id, group_id) for group_id in group_ids)

    def balance_score(self, slots, player_by_id, player, slot):
        group_score = 0
        if player.group_id:
            same_group_slots = [
                placed_slot
                for placed_slot in slots
                if placed_slot.player_id
                and player_by_id[placed_slot.player_id].group_id == player.group_id
            ]
            # Same-group first-round matches are filtered as a hard constraint.
            # Beyond that, keep teammates out of the same visual quarter first,
            # then prefer spreading them across left/right and top/bottom.
            group_score += 8 * sum(
                1
                for placed_slot in same_group_slots
                if placed_slot.visual_quarter == slot.visual_quarter
            )
            group_score += 2 * sum(
                1
                for placed_slot in same_group_slots
                if placed_slot.visual_half == slot.visual_half
            )
            group_score += sum(
                1
                for placed_slot in same_group_slots
                if placed_slot.visual_vertical == slot.visual_vertical
            )
            if self.has_same_group_first_round_opponent(slots, player_by_id, player, slot):
                group_score += 100
            if self.has_same_group_quarter_conflict(slots, player_by_id, player, slot):
                group_score += 40
            if self.has_same_group_rank_quarter_conflict(slots, player_by_id, player, slot):
                group_score += 30

        rank_group = rank_value(player.rank_group)
        if self.has_same_rank_first_round_opponent(slots, player_by_id, player, slot):
            group_score += 20
        if rank_group not in (1, 2):
            return group_score

        same_rank_slots = [
            placed_slot
            for placed_slot in slots
            if placed_slot.player_id
            and rank_value(player_by_id[placed_slot.player_id].rank_group) == rank_group
        ]
        half_count = sum(
            1 for placed_slot in same_rank_slots if placed_slot.visual_half == slot.visual_half
        )
        vertical_count = sum(
            1 for placed_slot in same_rank_slots if placed_slot.visual_vertical == slot.visual_vertical
        )
        return group_score + half_count + vertical_count


class BalancedGroupPlacementStrategy(SmartSeedPlacementStrategy):
    RANK_FIELDS = ("rank_lastyear",)
    RELAX_ORDER = (
        "same_group_balance",
        "same_group_first_round",
    )

    def is_group_rank_placement_valid(self, slots, player_by_id):
        # Balanced placement uses its own hierarchical group-count rules.
        return True

    def hard_constraint_slots(self, slots, player_by_id, player):
        candidate_slots = [
            slot
            for slot in slots
            if slot.occupied and not slot.player_id
        ]
        if self.is_hard("same_group_balance"):
            candidate_slots = [
                slot
                for slot in candidate_slots
                if self.within_group_balance_limits(slots, player_by_id, player, slot)
            ]
        if self.is_hard("same_group_first_round"):
            candidate_slots = [
                slot
                for slot in candidate_slots
                if not self.has_same_group_first_round_opponent(slots, player_by_id, player, slot)
            ]
        return candidate_slots

    def within_group_balance_limits(self, slots, player_by_id, player, slot):
        if not player.group_id:
            return True

        group_size = sum(
            candidate.group_id == player.group_id
            for candidate in player_by_id.values()
        )
        for block_count in self.balance_block_counts(group_size, len(slots)):
            limit = (group_size + block_count - 1) // block_count
            block_index = self.block_index(slot, block_count, len(slots))
            placed_count = sum(
                bool(placed_slot.player_id)
                and player_by_id[placed_slot.player_id].group_id == player.group_id
                and self.block_index(placed_slot, block_count, len(slots)) == block_index
                for placed_slot in slots
            )
            if placed_count >= limit:
                return False
        return True

    def balance_block_counts(self, group_size, slot_count):
        max_block_count = min(next_power_of_two(group_size), slot_count)
        block_counts = []
        block_count = 2
        while block_count <= max_block_count:
            block_counts.append(block_count)
            block_count *= 2
        return block_counts

    def block_index(self, slot, block_count, slot_count):
        return slot.index * block_count // slot_count

    def is_complete_placement_valid(self, slots, player_by_id):
        if not self.is_hard("same_group_balance"):
            return True

        group_ids = {
            player.group_id
            for player in player_by_id.values()
            if player.group_id
        }
        for group_id in group_ids:
            group_size = sum(
                player.group_id == group_id
                for player in player_by_id.values()
            )
            for block_count in self.balance_block_counts(group_size, len(slots)):
                counts = [
                    sum(
                        bool(slot.player_id)
                        and player_by_id[slot.player_id].group_id == group_id
                        and self.block_index(slot, block_count, len(slots)) == block_index
                        for slot in slots
                    )
                    for block_index in range(block_count)
                ]
                if max(counts) - min(counts) > 1:
                    return False
        return True

    def balance_score(self, slots, player_by_id, player, slot):
        if not player.group_id:
            return ()
        group_size = sum(
            candidate.group_id == player.group_id
            for candidate in player_by_id.values()
        )
        return tuple(
            sum(
                bool(placed_slot.player_id)
                and player_by_id[placed_slot.player_id].group_id == player.group_id
                and self.block_index(placed_slot, block_count, len(slots))
                == self.block_index(slot, block_count, len(slots))
                for placed_slot in slots
            )
            for block_count in self.balance_block_counts(group_size, len(slots))
        )


def player_id_from_entry(player):
    if isinstance(player, PlacementPlayer):
        return player.player_id
    if isinstance(player, dict):
        return player["player_id"]
    return str(player)


def placement_player_from_entry(player):
    if isinstance(player, PlacementPlayer):
        return player
    if isinstance(player, dict):
        return PlacementPlayer(
            player_id=str(player["player_id"]),
            group_id=str(player.get("group_id", "")),
            rank_group=str(player.get("rank_group", "")),
            rank_lastyear=str(player.get("rank_lastyear", "")),
            rank_total=str(player.get("rank_total", "")),
        )
    return PlacementPlayer(player_id=str(player))


def rank_value(value):
    value = str(value).strip()
    return int(value) if value.isdigit() else None


def build_slot_players(player_ids, strategy=None):
    if strategy:
        return strategy.build_slot_players(player_ids)
    return build_slot_players_from_ordered_ids(player_ids)
