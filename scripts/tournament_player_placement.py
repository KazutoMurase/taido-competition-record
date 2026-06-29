from dataclasses import dataclass
from dataclasses import replace
import random


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

    def __init__(self, rng=None, max_seed=8):
        self.rng = rng or random.Random()
        self.max_seed = max_seed

    def build_slot_players(self, players):
        placement_players = [placement_player_from_entry(player) for player in players]
        slots = build_slots(len(placement_players))
        apply_byes(slots, len(placement_players))

        seeded_players = self.seeded_players(placement_players)
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

        remaining_players = [
            player
            for player in placement_players
            if player.player_id not in seeded_player_ids
        ]
        self.place_remaining_players(slots, placement_players, remaining_players)
        return slot_player_ids(slots)

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

        solved_slots = self.solve_players_backtracking(slots, player_by_id, list(remaining_players))
        if not solved_slots:
            raise ValueError("could not place remaining players without breaking group constraints")
        for index, solved_slot in enumerate(solved_slots):
            slots[index].player_id = solved_slot.player_id

    def solve_players_backtracking(self, slots, player_by_id, remaining_players):
        if not remaining_players:
            return slots

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
            0 if self.lastyear_group_restriction(slots, player_by_id, player) else 1,
            0 if rank_value(player.rank_group) in (1, 2) else 1,
        )

    def hard_constraint_slots(self, slots, player_by_id, player):
        candidate_slots = [
            slot
            for slot in slots
            if slot.occupied and not slot.player_id
        ]
        restriction = self.lastyear_group_restriction(slots, player_by_id, player)
        if restriction:
            kind, value = restriction
            candidate_slots = [
                slot
                for slot in candidate_slots
                if getattr(slot, kind) == value
            ]

        opposing_half = self.opposing_rank_group_half(slots, player_by_id, player)
        if opposing_half:
            candidate_slots = [
                slot
                for slot in candidate_slots
                if slot.visual_half != opposing_half
            ]
        return candidate_slots

    def lastyear_group_restriction(self, slots, player_by_id, player):
        if not player.group_id or rank_value(player.rank_lastyear) is not None:
            return None

        lastyear_slots = [
            slot
            for slot in slots
            if slot.player_id
            and player_by_id[slot.player_id].group_id == player.group_id
            and rank_value(player_by_id[slot.player_id].rank_lastyear) is not None
        ]
        if not lastyear_slots:
            return None

        halves = {slot.visual_half for slot in lastyear_slots}
        verticals = {slot.visual_vertical for slot in lastyear_slots}

        # If a group has recommendation seeds on one side only, non-recommendation
        # teammates must go to the opposite side. If recommendation seeds already
        # exist on both sides, avoid their occupied top/bottom side when possible.
        if halves == {"left"}:
            return ("visual_half", "right")
        if halves == {"right"}:
            return ("visual_half", "left")
        if len(halves) > 1 and verticals == {"top"}:
            return ("visual_vertical", "bottom")
        if len(halves) > 1 and verticals == {"bottom"}:
            return ("visual_vertical", "top")
        return None

    def opposing_rank_group_half(self, slots, player_by_id, player):
        if not player.group_id:
            return None

        rank_group = rank_value(player.rank_group)
        if rank_group not in (1, 2):
            return None
        opposing_rank = 2 if rank_group == 1 else 1

        opposing_halves = {
            slot.visual_half
            for slot in slots
            if slot.player_id
            and player_by_id[slot.player_id].group_id == player.group_id
            and rank_value(player_by_id[slot.player_id].rank_group) == opposing_rank
        }
        if len(opposing_halves) == 1:
            return next(iter(opposing_halves))
        return None

    def balance_score(self, slots, player_by_id, player, slot):
        rank_group = rank_value(player.rank_group)
        if rank_group not in (1, 2):
            return 0

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
        return half_count + vertical_count


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
