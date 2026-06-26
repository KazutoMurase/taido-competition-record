from dataclasses import dataclass
import random


@dataclass
class TournamentSlot:
    index: int
    seed: int
    opponent_index: int
    player_id: str = ""
    occupied: bool = True


class PlacementStrategy:
    def build_slot_players(self, player_ids):
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

    def build_slot_players(self, player_ids):
        shuffled_player_ids = list(player_ids)
        self.rng.shuffle(shuffled_player_ids)
        return build_slot_players_from_ordered_ids(shuffled_player_ids)


def build_slot_players(player_ids, strategy=None):
    if strategy:
        return strategy.build_slot_players(player_ids)
    return build_slot_players_from_ordered_ids(player_ids)
