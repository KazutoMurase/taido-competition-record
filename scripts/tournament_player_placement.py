from dataclasses import dataclass
import random


@dataclass
class TournamentSlot:
    index: int
    seed: int
    opponent_index: int
    player_id: str = ""
    occupied: bool = True


@dataclass
class PlacementPlayer:
    player_id: str
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
        )
        for index, seed in enumerate(seeds)
    ]


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
        seed_to_slot = {slot.seed: slot for slot in slots}
        seeded_player_ids = set()

        for seed, player in enumerate(seeded_players, start=1):
            if seed > self.max_seed or seed not in seed_to_slot:
                break
            seed_to_slot[seed].player_id = player.player_id
            seeded_player_ids.add(player.player_id)

        remaining_player_ids = [
            player.player_id
            for player in placement_players
            if player.player_id not in seeded_player_ids
        ]
        self.rng.shuffle(remaining_player_ids)
        assign_players_to_open_slots(slots, remaining_player_ids)
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
