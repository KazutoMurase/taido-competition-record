#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path


MARKER_BEGIN = "-- BEGIN generated block tables"
MARKER_END = "-- END generated block tables"


def clean_text(value):
    return (value or "").strip().strip("'\"")


def read_blocks(court_type_csv):
    with court_type_csv.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    blocks = []
    for row in rows:
        name = clean_text(row.get("name", ""))
        if not name:
            continue
        block = name[0].lower()
        if not block.isalnum():
            raise ValueError(f"cannot derive block name from court name: {name}")
        blocks.append(block)
    return blocks


def block_sql_lines(blocks):
    lines = [MARKER_BEGIN]
    for block in blocks:
        lines.extend(
            [
                f"create table block_{block}",
                "(id integer not null,",
                " event_id integer not null,",
                " time_schedule text not null,",
                " before_final integer not null,",
                " final integer not null,",
                " players_checked integer not null,",
                " next_unused_num integer not null,",
                " foreign key (event_id) references event_type(id),",
                "primary key(id));",
                "",
                f"create table block_{block}_games",
                "(id integer not null,",
                " schedule_id integer not null,",
                " order_id integer not null,",
                " game_id integer not null,",
                f" foreign key (schedule_id) references block_{block}(id),",
                "primary key(id));",
                "",
                f"create table current_block_{block}",
                "(id integer not null,",
                " game_id integer not null,",
                f" foreign key (id) references block_{block}(id));",
                "",
            ]
        )
    for block in blocks:
        lines.extend(
            [
                f"\\copy block_{block} from 'block_{block}.csv' csv header;",
                f"\\copy block_{block}_games from 'block_{block}_games.csv' csv header;",
                "",
                f"insert into current_block_{block}(id, game_id) values (1, 1);",
                "",
            ]
        )
    lines.append(MARKER_END)
    return lines


def replace_generated_block(lines, generated_lines):
    if MARKER_BEGIN in lines and MARKER_END in lines:
        begin = lines.index(MARKER_BEGIN)
        end = lines.index(MARKER_END)
        return lines[:begin] + generated_lines + lines[end + 1 :]

    existing_block_start = next(
        (i for i, line in enumerate(lines) if line.startswith("create table block_")),
        None,
    )
    if existing_block_start is not None:
        raise ValueError(
            "generate_tables.sql already has block tables without generated markers. "
            "Remove them first or add marker comments."
        )

    award_start = next(
        (i for i, line in enumerate(lines) if line.startswith("create table awarded_players")),
        len(lines),
    )
    prefix = lines[:award_start]
    suffix = lines[award_start:]
    if prefix and prefix[-1] != "":
        prefix.append("")
    return prefix + generated_lines + [""] + suffix


def main():
    parser = argparse.ArgumentParser(
        description="Add block tables to original/generate_tables.sql from static/court_type.csv."
    )
    parser.add_argument("competition", help="competition directory under data/")
    args = parser.parse_args()

    base_dir = Path("data") / args.competition
    court_type_csv = base_dir / "static" / "court_type.csv"
    sql_path = base_dir / "original" / "generate_tables.sql"
    if not court_type_csv.exists():
        raise FileNotFoundError(court_type_csv)
    if not sql_path.exists():
        raise FileNotFoundError(sql_path)

    blocks = read_blocks(court_type_csv)
    if not blocks:
        raise ValueError(f"no blocks found in {court_type_csv}")

    lines = sql_path.read_text(encoding="utf-8").splitlines()
    updated = replace_generated_block(lines, block_sql_lines(blocks))
    sql_path.write_text("\n".join(updated).rstrip() + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
