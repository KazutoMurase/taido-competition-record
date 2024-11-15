create table test_groups
(id integer not null,
name text not null,
primary key(id));

create table test_court_type
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
test_zissen_kyuui_man_player_id integer unique,
test_hokei_kyuui_man_player_id integer unique,
test_zissen_kyuui_woman_player_id integer unique,
test_hokei_kyuui_woman_player_id integer unique,
test_hokei_sei_player_id integer unique,
test_hokei_mei_player_id integer unique,
test_zissen_sonen_man_player_id integer unique,
test_zissen_sonen_woman_player_id integer unique,
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
 foreign key (court_id) references test_court_type(id));

\copy test_groups from 'test_groups.csv' csv header;
\copy test_court_type from 'test_court_type.csv' csv header;
\copy test_players from 'test_players.csv' csv header;
