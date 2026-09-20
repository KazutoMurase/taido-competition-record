"""Lexicographic CP-SAT placement; slots use the existing game builder's order."""

from collections import Counter, defaultdict
from dataclasses import dataclass
import random
import threading

from ortools.sat.python import cp_model


# Visual Q1, Q2, Q3, Q4 correspond to tree quarters 0, 1, 3, 2.
QUARTER_NAMES = ("left_top", "left_bottom", "right_top", "right_bottom")
RANK_QUARTERS = (0, 3, 2, 1, 1, 2, 3, 0)


def visual_quarter(slot, size):
    return (0, 1, 3, 2)[slot * 4 // size]


def positive_rank(value):
    text = str(value).strip()
    return int(text) if text.isdecimal() and int(text) > 0 else None


@dataclass
class PlacementResult:
    slots: list[str]
    report: dict


class PlacementError(ValueError):
    pass


def local_rank_summary(players, slots):
    """Compute human-readable metrics from the final draw, not solver variables."""
    by_id = {
        str(p["player_id"]): positive_rank(p.get("rank_group", "")) for p in players
    }
    ranks = sorted({rank for rank in by_id.values() if rank is not None})
    summary = {
        str(rank): {
            "quarter_counts": dict.fromkeys(QUARTER_NAMES, 0),
            "first_round_matches": 0,
            "byes": 0,
            "non_bye": 0,
        }
        for rank in [*ranks, "unranked"]
    }
    for s, player in enumerate(slots):
        if not player:
            continue
        rank = by_id[player]
        entry = summary[str(rank) if rank is not None else "unranked"]
        entry["quarter_counts"][QUARTER_NAMES[visual_quarter(s, len(slots))]] += 1
        entry["non_bye" if slots[s ^ 1] else "byes"] += 1
    for s in range(0, len(slots), 2):
        a, b = slots[s : s + 2]
        if a and b and by_id[a] is not None and by_id[a] == by_id[b]:
            summary[str(by_id[a])]["first_round_matches"] += 1
    return summary


def optimize(players, *, seed=1, time_limit=60.0, hierarchical=True, progress=None):
    """Prove each objective optimal before fixing it and proceeding.

    The time limit applies to each solve. A timeout never silently relaxes a
    constraint or fixes an unproven incumbent. The last solve is satisfaction
    with a seeded decision order, not another sporting objective.
    """
    n = len(players)
    if n < 2:
        raise PlacementError("at least two participants are required")
    ids = [str(p["player_id"]) for p in players]
    if any(not p for p in ids) or len(set(ids)) != n:
        raise PlacementError(
            "participant IDs must be nonempty and unique within each event"
        )
    ranks = [positive_rank(p.get("rank_total", "")) for p in players]
    for rank in range(1, 5):
        if ranks.count(rank) > 1:
            raise PlacementError(
                f"duplicate rank_total={rank}; top four ranks must be unique"
            )
    groups = defaultdict(list)
    for i, p in enumerate(players):
        if p.get("group_id"):
            groups[str(p["group_id"])].append(i)
    size = 1 << (n - 1).bit_length()
    model = cp_model.CpModel()
    x = [[model.new_bool_var(f"x_{i}_{s}") for s in range(size)] for i in range(n)]
    for row in x:
        model.add_exactly_one(row)
    occupied = [sum(x[i][s] for i in range(n)) for s in range(size)]
    for count in occupied:
        model.add(count <= 1)
    for s in range(0, size, 2):
        model.add(occupied[s] + occupied[s + 1] >= 1)
    # N=2 has only two halves. N=3 already has four slots/quarters.
    quarter_slots = [
        [s for s in range(size) if visual_quarter(s, size) == q] for q in range(4)
    ]
    in_quarter = [
        [sum(x[i][s] for s in slots) for slots in quarter_slots] for i in range(n)
    ]
    for q in range(4):
        count = sum(in_quarter[i][q] for i in range(n))
        model.add(count >= n // 4)
        model.add(count <= (n + 3) // 4)
    for i, rank in enumerate(ranks):
        if rank is not None and rank <= 4:
            q = RANK_QUARTERS[rank - 1]
            if size == 2:
                # Project unavailable top/bottom quarters onto their half.
                model.add(x[i][0 if q < 2 else 1] == 1)
            else:
                # Visual right-hand slots run bottom to top in tree order.
                corner = (0, size // 2 - 1, size - 1, size // 2)[q]
                model.add(x[i][corner] == 1)
    for members in groups.values():
        if len(members) == 2:
            model.add(sum(x[i][s] for i in members for s in range(size // 2)) == 1)

    def deviation(members, regions, label):
        lo, hi = (
            len(members) // len(regions),
            (len(members) + len(regions) - 1) // len(regions),
        )
        terms = []
        for r, slots in enumerate(regions):
            count = sum(x[i][s] for i in members for s in slots)
            over = model.new_int_var(0, len(members), f"{label}_over_{r}")
            under = model.new_int_var(0, len(members), f"{label}_under_{r}")
            model.add_max_equality(over, [0, count - hi])
            model.add_max_equality(under, [0, lo - count])
            terms.extend((over, under))
        return terms

    stages = []
    org_terms = []
    for group, members in groups.items():
        org_terms.extend(deviation(members, quarter_slots, f"org_{group}"))
    stages.append(("organization_balance", sum(org_terms)))
    first_terms = []
    for group, members in groups.items():
        if len(members) < 2:
            continue
        for s in range(0, size, 2):
            collision = model.new_bool_var(f"collision_{group}_{s}")
            count = sum(x[i][s] + x[i][s + 1] for i in members)
            model.add_max_equality(collision, [0, count - 1])
            first_terms.append(collision)
    stages.append(("same_group_first_round", sum(first_terms)))
    bands = sorted(
        {(rank - 1) // 4 for rank in ranks if rank is not None and rank >= 5}
    )
    for band in bands:
        members = [
            i
            for i, rank in enumerate(ranks)
            if rank is not None and (rank - 1) // 4 == band
        ]
        label = f"global_rank_{band * 4 + 1}_{band * 4 + 4}"
        stages.append(
            (label + "_spread", sum(deviation(members, quarter_slots, label)))
        )
        if band == 1:
            # Preserve the 5--8 band spread, but swap its members before
            # preserving rank directions when top-eight teammates would meet
            # in the same quarter. Count excess ranked teammates per quarter.
            top_eight_terms = []
            for group, group_members in groups.items():
                ranked = [
                    i for i in group_members if ranks[i] is not None and ranks[i] <= 8
                ]
                if len(ranked) < 2:
                    continue
                for q in range(4):
                    excess = model.new_int_var(
                        0, len(ranked) - 1, f"top8_org_{group}_{q}"
                    )
                    model.add_max_equality(
                        excess, [0, sum(in_quarter[i][q] for i in ranked) - 1]
                    )
                    top_eight_terms.append(excess)
            stages.append(("top8_same_group_quarter", sum(top_eight_terms)))
        stages.append(
            (
                label + "_direction",
                sum(
                    1 - in_quarter[i][RANK_QUARTERS[(ranks[i] - 1) % 8]]
                    for i in members
                ),
            )
        )
        if band == 1 and size >= 8:
            # The inner edge of each visual quarter is opposite its top-four
            # corner. A swapped seed follows its new quarter, not its rank's
            # original quarter. This stays soft behind group/round constraints.
            block = size // 4
            opposite_edges = (block - 1, block, 3 * block, 3 * block - 1)
            stages.append(
                (
                    "global_rank_5_8_seed_position",
                    sum(1 - sum(x[i][s] for s in opposite_edges) for i in members),
                )
            )
    if hierarchical:
        region_count = 8
        max_rank = max((rank for rank in ranks if rank is not None), default=0)
        while region_count <= size and region_count // 2 < max_rank:
            members = [
                i
                for i, rank in enumerate(ranks)
                if rank is not None and rank <= region_count
            ]
            regions = [
                range(r * size // region_count, (r + 1) * size // region_count)
                for r in range(region_count)
            ]
            label = f"top_{region_count}_spread"
            stages.append((label, sum(deviation(members, regions, label))))
            region_count *= 2
    local_terms = []
    for group, members in groups.items():
        local_bands = defaultdict(list)
        for i in members:
            rank = positive_rank(players[i].get("rank_group", ""))
            if rank is not None:
                local_bands[(rank - 1) // 4].append(i)
        for band, ranked in sorted(local_bands.items()):
            local_terms.extend(
                deviation(ranked, quarter_slots, f"local_{group}_{band}")
            )
    stages.append(("local_rank_spread", sum(local_terms)))

    # Compare the same organization rank across all organizations: for example,
    # all rank-1 players should be spread, not just each group's ranks 1--4.
    local_ranks = defaultdict(list)
    for i, player in enumerate(players):
        rank = positive_rank(player.get("rank_group", ""))
        if rank is not None:
            local_ranks[rank].append(i)
    if local_ranks:
        balance_terms = []
        for rank, members in sorted(local_ranks.items()):
            balance_terms.extend(
                deviation(members, quarter_slots, f"same_local_rank_{rank}")
            )
        stages.append(("same_local_rank_quarter_balance", sum(balance_terms)))

        bye_matches = []
        if size > n:
            for s in range(0, size, 2):
                bye = model.new_bool_var(f"bye_match_{s // 2}")
                model.add(occupied[s] + occupied[s + 1] + bye == 2)
                bye_matches.append(bye)
            model.add(sum(bye_matches) == size - n)

        rank_collisions = []
        rank_byes = {}
        for rank, members in sorted(local_ranks.items()):
            collisions, byes = [], []
            for match, s in enumerate(range(0, size, 2)):
                count = sum(x[i][s] + x[i][s + 1] for i in members)
                collision = model.new_bool_var(f"same_local_rank_match_{rank}_{match}")
                model.add_max_equality(collision, [0, count - 1])
                collisions.append(collision)
                if bye_matches:
                    bye = model.new_bool_var(f"local_rank_bye_{rank}_{match}")
                    model.add(bye == count).only_enforce_if(bye_matches[match])
                    model.add(bye == 0).only_enforce_if(bye_matches[match].Not())
                    byes.append(bye)
            rank_collisions.extend(collisions)
            rank_byes[rank] = byes
            # Valid counting bound: each played match contains at most one
            # player of this rank, plus one for each same-rank collision.
            model.add(len(members) - sum(byes) <= n - size // 2 + sum(collisions))
        if bye_matches:
            model.add(
                sum(bye for byes in rank_byes.values() for bye in byes) <= size - n
            )
            # Lexicographic priority, not numeric rank weights: first maximize
            # rank-1 BYEs, then rank-2 BYEs, etc., without worsening any earlier
            # objective. Missing/zero ranks have no priority over known ranks.
            for rank, members in sorted(local_ranks.items()):
                stages.append(
                    (f"local_rank_{rank}_non_bye", len(members) - sum(rank_byes[rank]))
                )
        stages.append(("same_local_rank_first_round", sum(rank_collisions)))

    reports = []

    def solve(label, randomized=False):
        solver = cp_model.CpSolver()
        solver.parameters.num_search_workers = 1
        solver.parameters.random_seed = seed % (2**31 - 1)
        solver.parameters.max_time_in_seconds = time_limit
        # Repeated presolve of this dense assignment model can consume the
        # entire budget at 128 slots. The explicit constraints and complete
        # incumbent work well directly, without presolve or symmetry analysis.
        solver.parameters.cp_model_presolve = False
        solver.parameters.symmetry_level = 0
        if randomized:
            solver.parameters.search_branching = cp_model.FIXED_SEARCH
        if progress:
            progress(f"{label}: solving (limit {time_limit:g}s)")
        done = threading.Event()

        def heartbeat():
            elapsed = 0
            while not done.wait(15):
                elapsed += 15
                progress(f"{label}: solving ({elapsed}s elapsed)")

        thread = threading.Thread(target=heartbeat, daemon=True) if progress else None
        if thread:
            thread.start()
        try:
            status = solver.solve(model)
        finally:
            done.set()
            if thread:
                thread.join()
        name = solver.status_name(status)
        if status == cp_model.INFEASIBLE:
            raise PlacementError(
                f"{label}: INFEASIBLE; top-four placement, two-member left/right separation, quarter counts or BYEs conflict; hard constraints were not relaxed"
            )
        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            raise PlacementError(
                f"{label}: {name} (no proven solution); increase --time-limit; no output published"
            )
        return solver, name

    fallback_slots = None

    for label, objective in stages:
        model.minimize(objective)
        solver, status = solve(label)
        value = int(solver.value(objective))
        reports.append({"name": label, "value": value, "status": status})
        if progress:
            progress(f"{label}: {status}, value={value}")
        model.add(objective == value)
        model.clear_hints()
        # Include auxiliary counts too: a complete incumbent remains feasible
        # after fixing the optimum and avoids expensive hint reconstruction.
        for index in range(len(model.proto.variables)):
            variable = model.get_int_var_from_proto_index(index)
            model.add_hint(variable, solver.value(variable))

        fallback_slots = [""] * size
        for i, row in enumerate(x):
            for s, variable in enumerate(row):
                if solver.boolean_value(variable):
                    fallback_slots[s] = ids[i]

    # Sporting objectives are all fixed. Randomize only the remaining choices.
    model.clear_objective()
    model.clear_hints()
    # Assign one participant at a time. Interleaving all assignment Booleans
    # creates expensive dead ends once most BYEs are reserved for high ranks.
    rng = random.Random(seed)
    player_order = list(range(n))
    rng.shuffle(player_order)
    decisions = []
    for i in player_order:
        choices = x[i][:]
        rng.shuffle(choices)
        decisions.extend(choices)
    model.add_decision_strategy(
        decisions, cp_model.CHOOSE_FIRST, cp_model.SELECT_MAX_VALUE
    )
    try:
        solver, status = solve("random_tie_break", randomized=True)
    except PlacementError as e:
        if "UNKNOWN" in str(e) and fallback_slots:
            status = "UNKNOWN_FALLBACK"
            solver = None
        else:
            raise

    if progress:
        progress(f"random_tie_break: {status}")
    if solver:
        slots = [""] * size
        for i, row in enumerate(x):
            for s, variable in enumerate(row):
                if solver.boolean_value(variable):
                    slots[s] = ids[i]
    else:
        slots = fallback_slots
    by_id = {str(p["player_id"]): p for p in players}
    counts = Counter(
        visual_quarter(s, size) for s, player in enumerate(slots) if player
    )
    report = {
        "player_count": n,
        "slot_count": size,
        "bye_count": size - n,
        "quarter_counts": {name: counts[q] for q, name in enumerate(QUARTER_NAMES)},
        "organization_quarter_counts": {
            group: {
                name: sum(
                    bool(player)
                    and str(by_id[player].get("group_id", "")) == group
                    and visual_quarter(s, size) == q
                    for s, player in enumerate(slots)
                )
                for q, name in enumerate(QUARTER_NAMES)
            }
            for group in groups
        },
        "stages": reports,
        "tie_break_status": status,
        "slots": slots,
        "local_rank_summary": local_rank_summary(players, slots),
    }
    return PlacementResult(slots, report)
