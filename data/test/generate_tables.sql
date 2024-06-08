create table test_groups
(id integer not null,
name text not null,
primary key(id));

create table test_players
(id integer not null,
group_id integer not null,
name text not null,
name_kana text not null,
test_zissen_man_player_id integer unique,
test_hokei_man_player_id integer unique,
test_zissen_woman_player_id integer unique,
test_hokei_woman_player_id integer unique,
test_hokei_sonen_player_id integer unique,
primary key(id),
foreign key (group_id) references test_groups(id));

create table test_notification_request
(id serial not null,
 event_id integer not null,
 player_id integer unique,
 group_id integer,
 group_name text,
 court_id integer not null,
 primary key(id),
 foreign key (event_id) references event_type(id),
 foreign key (player_id) references test_players(id),
 foreign key (court_id) references court_type(id));

\copy test_groups from 'test_groups.csv' csv header;
\copy test_players from 'test_players.csv' csv header;

insert into court_type(id,name) values (100, 'Xコート');
insert into court_type(id,name) values (101, 'Yコート');

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

\COPY test_hokei_man from 'test_hokei_man.csv' csv header;
\COPY test_zissen_man from 'test_zissen_man.csv' csv header;
\COPY test_hokei_woman from 'test_hokei_woman.csv' csv header;
\COPY test_zissen_woman from 'test_zissen_woman.csv' csv header;

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
foreign key (left_group_id) references dantai_zissen_man_groups(id),
foreign key (right_group_id) references dantai_zissen_man_groups(id),
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

\COPY block_x from 'block_x.csv' csv header;
\COPY block_x_games from 'block_x_games.csv' csv header;
insert into current_block_x(id, game_id) values (1, 1);

\COPY block_y from 'block_y.csv' csv header;
\COPY block_y_games from 'block_y_games.csv' csv header;
insert into current_block_y(id, game_id) values (1, 1);

create table test_dantai
(id integer not null,
 event_id integer not null,
 game_id integer not null,
 group_id integer not null,
 foreign key (event_id) references event_type(id),
 foreign key (group_id) references test_groups(id),
 primary key(id));

\COPY test_dantai from 'test_dantai.csv' csv header;
