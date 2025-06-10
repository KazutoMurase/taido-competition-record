create table groups
(id integer not null,
name text not null,
primary key(id));

create table event_type
(id integer not null,
 name text not null,
 name_en text not null,
 order_id integer not null,
 existence integer not null,
 full_name text not null,
 description text not null,
 primary key(id));

create table court_type
(id integer not null,
 name text not null,
 primary key(id));

create table players
(id integer not null,
group_id integer not null,
name text not null,
name_kana text not null,
zissen_man_player_id integer unique,
zissen_woman_player_id integer unique,
zissen_sonen_man_player_id integer unique,
zissen_sonen_woman_player_id integer unique,
hokei_man_player_id integer unique,
hokei_woman_player_id integer unique,
hokei_kyuui_player_id integer unique,
hokei_newcommer_player_id integer unique,
hokei_mei_player_id integer unique,
hokei_mei_kyuui_newcommer_player_id integer unique,
hokei_sei_player_id integer unique,
primary key(id),
foreign key (group_id) references groups(id));

create table notification_request
(id serial not null,
 event_id integer not null,
 player_id integer unique,
 group_id integer,
 group_name text,
 court_id integer not null,
 primary key(id),
 foreign key (event_id) references event_type(id),
 foreign key (player_id) references players(id),
 foreign key (court_id) references court_type(id));

\copy groups from 'groups.csv' csv header;
\copy event_type from 'event_type.csv' csv header;
\copy court_type from 'court_type.csv' csv header;
\copy players from 'players.csv' csv header;
