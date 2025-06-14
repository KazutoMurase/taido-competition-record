create table test_hokei_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_hokei_man_player_id),
foreign key (right_player_id) references test_players(test_hokei_man_player_id),
primary key(id));

create table test_zissen_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_zissen_man_player_id),
foreign key (right_player_id) references test_players(test_zissen_man_player_id),
primary key(id));

create table test_hokei_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_hokei_woman_player_id),
foreign key (right_player_id) references test_players(test_hokei_woman_player_id),
primary key(id));

create table test_zissen_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_zissen_woman_player_id),
foreign key (right_player_id) references test_players(test_zissen_woman_player_id),
primary key(id));

create table test_hokei_kyuui_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_hokei_kyuui_man_player_id),
foreign key (right_player_id) references test_players(test_hokei_kyuui_man_player_id),
primary key(id));

create table test_zissen_kyuui_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_zissen_kyuui_man_player_id),
foreign key (right_player_id) references test_players(test_zissen_kyuui_man_player_id),
primary key(id));

create table test_hokei_kyuui_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_hokei_kyuui_woman_player_id),
foreign key (right_player_id) references test_players(test_hokei_kyuui_woman_player_id),
primary key(id));

create table test_zissen_kyuui_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_zissen_kyuui_woman_player_id),
foreign key (right_player_id) references test_players(test_zissen_kyuui_woman_player_id),
primary key(id));

create table test_hokei_sei
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_hokei_sei_player_id),
foreign key (right_player_id) references test_players(test_hokei_sei_player_id),
primary key(id));

create table test_hokei_mei
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_hokei_mei_player_id),
foreign key (right_player_id) references test_players(test_hokei_mei_player_id),
primary key(id));

create table test_zissen_sonen_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_zissen_sonen_man_player_id),
foreign key (right_player_id) references test_players(test_zissen_sonen_man_player_id),
primary key(id));

create table test_zissen_sonen_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references test_players(test_zissen_sonen_woman_player_id),
foreign key (right_player_id) references test_players(test_zissen_sonen_woman_player_id),
primary key(id));

\COPY test_hokei_man from 'test_hokei_man.csv' csv header;
\COPY test_zissen_man from 'test_zissen_man.csv' csv header;
\COPY test_hokei_woman from 'test_hokei_woman.csv' csv header;
\COPY test_zissen_woman from 'test_zissen_woman.csv' csv header;
\COPY test_hokei_kyuui_man from 'test_hokei_kyuui_man.csv' csv header;
\COPY test_zissen_kyuui_man from 'test_zissen_kyuui_man.csv' csv header;
\COPY test_hokei_kyuui_woman from 'test_hokei_kyuui_woman.csv' csv header;
\COPY test_zissen_kyuui_woman from 'test_zissen_kyuui_woman.csv' csv header;
\COPY test_hokei_sei from 'test_hokei_sei.csv' csv header;
\COPY test_hokei_mei from 'test_hokei_mei.csv' csv header;
\COPY test_zissen_sonen_man from 'test_zissen_sonen_man.csv' csv header;
\COPY test_zissen_sonen_woman from 'test_zissen_sonen_woman.csv' csv header;

create table test_dantai_zissen_man_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_dantai_zissen_woman_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_dantai_zissen_man
(id integer not null,
left_group_id integer,
right_group_id integer,
next_left_id integer,
next_right_id integer,
left_group_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_group_id) references test_dantai_zissen_man_groups(id),
foreign key (right_group_id) references test_dantai_zissen_man_groups(id),
primary key(id));

create table test_dantai_zissen_woman
(id integer not null,
left_group_id integer,
right_group_id integer,
next_left_id integer,
next_right_id integer,
left_group_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_group_id) references test_dantai_zissen_woman_groups(id),
foreign key (right_group_id) references test_dantai_zissen_woman_groups(id),
primary key(id));

\copy test_dantai_zissen_man_groups from 'test_dantai_zissen_man_groups.csv' csv header;
\copy test_dantai_zissen_woman_groups from 'test_dantai_zissen_woman_groups.csv' csv header;

\copy test_dantai_zissen_man from 'test_dantai_zissen_man.csv' csv header;
\copy test_dantai_zissen_woman from 'test_dantai_zissen_woman.csv' csv header;

create table test_dantai_hokei_man_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_dantai_hokei_man
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references test_dantai_hokei_man_groups(id),
primary key(id));

create table test_dantai_hokei_woman_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_dantai_hokei_woman
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references test_dantai_hokei_woman_groups(id),
primary key(id));

create table test_dantai_hokei_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_dantai_hokei
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references test_dantai_hokei_groups(id),
primary key(id));

create table test_dantai_hokei_newcommer_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_dantai_hokei_newcommer
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references test_dantai_hokei_newcommer_groups(id),
primary key(id));

create table test_tenkai_man_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_tenkai_man
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
foreign key (group_id) references test_tenkai_man_groups(id),
primary key(id));

create table test_tenkai_woman_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_tenkai_woman
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
foreign key (group_id) references test_tenkai_woman_groups(id),
primary key(id));

create table test_tenkai_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references test_groups(id),
primary key(id));

create table test_tenkai
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
foreign key (group_id) references test_tenkai_groups(id),
primary key(id));

\copy test_dantai_hokei_man_groups from 'test_dantai_hokei_man_groups.csv' csv header;
\copy test_dantai_hokei_man from 'test_dantai_hokei_man.csv' csv header;
\copy test_dantai_hokei_woman_groups from 'test_dantai_hokei_woman_groups.csv' csv header;
\copy test_dantai_hokei_woman from 'test_dantai_hokei_woman.csv' csv header;
\copy test_dantai_hokei_groups from 'test_dantai_hokei_groups.csv' csv header;
\copy test_dantai_hokei from 'test_dantai_hokei.csv' csv header;
\copy test_dantai_hokei_newcommer_groups from 'test_dantai_hokei_newcommer_groups.csv' csv header;
\copy test_dantai_hokei_newcommer from 'test_dantai_hokei_newcommer.csv' csv header;
\copy test_tenkai_man_groups from 'test_tenkai_man_groups.csv' csv header;
\copy test_tenkai_man from 'test_tenkai_man.csv' csv header;
\copy test_tenkai_woman_groups from 'test_tenkai_woman_groups.csv' csv header;
\copy test_tenkai_woman from 'test_tenkai_woman.csv' csv header;
\copy test_tenkai_groups from 'test_tenkai_groups.csv' csv header;
\copy test_tenkai from 'test_tenkai.csv' csv header;

create table block_u
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_u_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_u(id),
primary key(id));

create table current_block_u
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_u(id));

create table block_v
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_v_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_v(id),
primary key(id));

create table current_block_v
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_v(id));

create table block_w
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_w_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_w(id),
primary key(id));

create table current_block_w
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_w(id));

create table block_x
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_x_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_x(id),
primary key(id));

create table current_block_x
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_x(id));

create table block_y
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_y_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_y(id),
primary key(id));

create table current_block_y
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_y(id));

create table block_z
(id integer not null,
 event_id integer not null,
 time_schedule text not null,
 before_final integer not null,
 final integer not null,
 players_checked integer not null,
 next_unused_num integer not null,
 foreign key (event_id) references event_type(id),
primary key(id));

create table block_z_games
(id integer not null,
 schedule_id integer not null,
 order_id integer not null,
 game_id integer not null,
 foreign key (schedule_id) references block_z(id),
primary key(id));

create table current_block_z
(id integer not null,
 game_id integer not null,
 foreign key (id) references block_z(id));

\COPY block_u from 'block_u.csv' csv header;
\COPY block_u_games from 'block_u_games.csv' csv header;
insert into current_block_u(id, game_id) values (1, 1);

\COPY block_v from 'block_v.csv' csv header;
\COPY block_v_games from 'block_v_games.csv' csv header;
insert into current_block_v(id, game_id) values (1, 1);

\COPY block_w from 'block_w.csv' csv header;
\COPY block_w_games from 'block_w_games.csv' csv header;
insert into current_block_w(id, game_id) values (1, 1);

\COPY block_x from 'block_x.csv' csv header;
\COPY block_x_games from 'block_x_games.csv' csv header;
insert into current_block_x(id, game_id) values (1, 1);

\COPY block_y from 'block_y.csv' csv header;
\COPY block_y_games from 'block_y_games.csv' csv header;
insert into current_block_y(id, game_id) values (1, 1);

\COPY block_z from 'block_z.csv' csv header;
\COPY block_z_games from 'block_z_games.csv' csv header;
insert into current_block_z(id, game_id) values (1, 1);
