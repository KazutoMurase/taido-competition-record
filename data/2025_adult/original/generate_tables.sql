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

create table hokei_newcommer
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_newcommer_player_id),
foreign key (right_player_id) references players(hokei_newcommer_player_id),
primary key(id));

create table hokei_kyuui
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_kyuui_player_id),
foreign key (right_player_id) references players(hokei_kyuui_player_id),
primary key(id));

create table zissen_sonen_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(zissen_sonen_man_player_id),
foreign key (right_player_id) references players(zissen_sonen_man_player_id),
primary key(id));

create table zissen_sonen_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(zissen_sonen_woman_player_id),
foreign key (right_player_id) references players(zissen_sonen_woman_player_id),
primary key(id));

create table hokei_mei
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_mei_player_id),
foreign key (right_player_id) references players(hokei_mei_player_id),
primary key(id));

create table hokei_mei_kyuui_newcommer
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_mei_kyuui_newcommer_player_id),
foreign key (right_player_id) references players(hokei_mei_kyuui_newcommer_player_id),
primary key(id));

create table hokei_sei
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(hokei_sei_player_id),
foreign key (right_player_id) references players(hokei_sei_player_id),
primary key(id));

\copy hokei_man from 'hokei_man.csv' csv header;
\copy zissen_man from 'zissen_man.csv' csv header;
\copy hokei_woman from 'hokei_woman.csv' csv header;
\copy zissen_woman from 'zissen_woman.csv' csv header;
\copy hokei_newcommer from 'hokei_newcommer.csv' csv header;
\copy hokei_kyuui from 'hokei_kyuui.csv' csv header;
\copy zissen_sonen_man from 'zissen_sonen_man.csv' csv header;
\copy zissen_sonen_woman from 'zissen_sonen_woman.csv' csv header;
\copy hokei_mei from 'hokei_mei.csv' csv header;
\copy hokei_mei_kyuui_newcommer from 'hokei_mei_kyuui_newcommer.csv' csv header;
\copy hokei_sei from 'hokei_sei.csv' csv header;

create table awarded_players
(id integer not null,
award_name text not null,
player_id integer,
name text,
foreign key (player_id) references players(id),
primary key (id));

\copy awarded_players from 'awarded_players.csv' csv header;
