create table hokei_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_man_player_id),
foreign key (right_player_id) references players(hokei_man_player_id),
primary key(id));

create table hokei_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_woman_player_id),
foreign key (right_player_id) references players(hokei_woman_player_id),
primary key(id));

create table hokei_sonen
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_sonen_player_id),
foreign key (right_player_id) references players(hokei_sonen_player_id),
primary key(id));

create table zissen_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(zissen_man_player_id),
foreign key (right_player_id) references players(zissen_man_player_id),
primary key(id));

create table zissen_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(zissen_woman_player_id),
foreign key (right_player_id) references players(zissen_woman_player_id),
primary key(id));

\copy hokei_man from 'hokei_man.csv' csv header;
\copy zissen_man from 'zissen_man.csv' csv header;
\copy hokei_woman from 'hokei_woman.csv' csv header;
\copy zissen_woman from 'zissen_woman.csv' csv header;
\copy hokei_sonen from 'hokei_sonen.csv' csv header;

create table dantai_zissen_man_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table dantai_zissen_woman_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table dantai_zissen_man
(id integer not null,
left_group_id integer,
right_group_id integer,
next_left_id integer,
next_right_id integer,
left_group_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_group_id) references dantai_zissen_man_groups(id),
foreign key (right_group_id) references dantai_zissen_man_groups(id),
primary key(id));

create table dantai_zissen_woman
(id integer not null,
left_group_id integer,
right_group_id integer,
next_left_id integer,
next_right_id integer,
left_group_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_group_id) references dantai_zissen_woman_groups(id),
foreign key (right_group_id) references dantai_zissen_woman_groups(id),
primary key(id));

\copy dantai_zissen_man_groups from 'dantai_zissen_man_groups.csv' csv header;
\copy dantai_zissen_woman_groups from 'dantai_zissen_woman_groups.csv' csv header;

\copy dantai_zissen_man from 'dantai_zissen_man.csv' csv header;
\copy dantai_zissen_woman from 'dantai_zissen_woman.csv' csv header;

create table dantai_hokei_man_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table dantai_hokei_woman_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table dantai_hokei_man
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references dantai_hokei_man_groups(id),
primary key(id));

create table dantai_hokei_woman
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references dantai_hokei_woman_groups(id),
primary key(id));

\copy dantai_hokei_man_groups from 'dantai_hokei_man_groups.csv' csv header;
\copy dantai_hokei_woman_groups from 'dantai_hokei_woman_groups.csv' csv header;
\copy dantai_hokei_man from 'dantai_hokei_man.csv' csv header;
\copy dantai_hokei_woman from 'dantai_hokei_woman.csv' csv header;

create table tenkai_man_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table tenkai_woman_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table tenkai_man
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
sub3_score real,
sub4_score real,
sub5_score real,
elapsed_time real,
penalty real,
retire integer,
foreign key (group_id) references tenkai_man_groups(id),
primary key(id));

create table tenkai_woman
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
sub3_score real,
sub4_score real,
sub5_score real,
elapsed_time real,
penalty real,
retire integer,
foreign key (group_id) references tenkai_woman_groups(id),
primary key(id));

\copy tenkai_man_groups from 'tenkai_man_groups.csv' csv header;
\copy tenkai_woman_groups from 'tenkai_woman_groups.csv' csv header;
\copy tenkai_man from 'tenkai_man.csv' csv header;
\copy tenkai_woman from 'tenkai_woman.csv' csv header;

create table block_a
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_a_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_a(id),
primary key(id));

create table current_block_a
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_a(id));

create table block_b
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_b_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_b(id),
primary key(id));

create table current_block_b
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_b(id));

create table block_c
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_c_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_c(id),
primary key(id));

create table current_block_c
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_c(id));

create table block_d
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_d_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_d(id),
primary key(id));

create table current_block_d
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_d(id));

\copy block_a from 'block_a.csv' csv header;
\copy block_a_games from 'block_a_games.csv' csv header;
\copy current_block_a from 'current_block_a.csv' csv header;

\copy block_b from 'block_b.csv' csv header;
\copy block_b_games from 'block_b_games.csv' csv header;
\copy current_block_b from 'current_block_b.csv' csv header;

\copy block_c from 'block_c.csv' csv header;
\copy block_c_games from 'block_c_games.csv' csv header;
\copy current_block_c from 'current_block_c.csv' csv header;

\copy block_d from 'block_d.csv' csv header;
\copy block_d_games from 'block_d_games.csv' csv header;
\copy current_block_d from 'current_block_d.csv' csv header;

create table awarded_players
(id integer not null,
award_name text not null,
player_id integer,
foreign key (player_id) references players(id),
primary key (id));

\copy awarded_players from 'awarded_players.csv' csv header;
