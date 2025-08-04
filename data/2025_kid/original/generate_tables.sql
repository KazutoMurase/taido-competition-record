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

create table junior_high_hokei_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(junior_high_hokei_man_player_id),
foreign key (right_player_id) references players(junior_high_hokei_man_player_id),
primary key(id));

create table junior_high_hokei_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(junior_high_hokei_woman_player_id),
foreign key (right_player_id) references players(junior_high_hokei_woman_player_id),
primary key(id));

create table junior_high_zissen_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(junior_high_zissen_man_player_id),
foreign key (right_player_id) references players(junior_high_zissen_man_player_id),
primary key(id));

create table junior_high_zissen_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(junior_high_zissen_woman_player_id),
foreign key (right_player_id) references players(junior_high_zissen_woman_player_id),
primary key(id));

create table higher_grades_hokei_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(higher_grades_hokei_man_player_id),
foreign key (right_player_id) references players(higher_grades_hokei_man_player_id),
primary key(id));

create table higher_grades_hokei_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(higher_grades_hokei_woman_player_id),
foreign key (right_player_id) references players(higher_grades_hokei_woman_player_id),
primary key(id));

create table higher_grades_zissen_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(higher_grades_zissen_man_player_id),
foreign key (right_player_id) references players(higher_grades_zissen_man_player_id),
primary key(id));

create table higher_grades_zissen_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(higher_grades_zissen_woman_player_id),
foreign key (right_player_id) references players(higher_grades_zissen_woman_player_id),
primary key(id));

create table lower_grades_hokei_man
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(lower_grades_hokei_man_player_id),
foreign key (right_player_id) references players(lower_grades_hokei_man_player_id),
primary key(id));

create table lower_grades_hokei_woman
(id integer not null,
left_player_id integer,
right_player_id integer,
next_left_id integer,
next_right_id integer,
left_player_flag integer,
left_retire integer,
right_retire integer,
foreign key (left_player_id) references players(lower_grades_hokei_woman_player_id),
foreign key (right_player_id) references players(lower_grades_hokei_woman_player_id),
primary key(id));

\copy hokei_man from 'hokei_man.csv' csv header;
\copy zissen_man from 'zissen_man.csv' csv header;
\copy hokei_woman from 'hokei_woman.csv' csv header;
\copy zissen_woman from 'zissen_woman.csv' csv header;
\copy junior_high_hokei_man from 'junior_high_hokei_man.csv' csv header;
\copy junior_high_zissen_man from 'junior_high_zissen_man.csv' csv header;
\copy junior_high_hokei_woman from 'junior_high_hokei_woman.csv' csv header;
\copy junior_high_zissen_woman from 'junior_high_zissen_woman.csv' csv header;
\copy higher_grades_hokei_man from 'higher_grades_hokei_man.csv' csv header;
\copy higher_grades_zissen_man from 'higher_grades_zissen_man.csv' csv header;
\copy higher_grades_hokei_woman from 'higher_grades_hokei_woman.csv' csv header;
\copy higher_grades_zissen_woman from 'higher_grades_zissen_woman.csv' csv header;
\copy lower_grades_hokei_man from 'lower_grades_hokei_man.csv' csv header;
\copy lower_grades_hokei_woman from 'lower_grades_hokei_woman.csv' csv header;

create table dantai_hokei_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table dantai_hokei
(id integer not null,
group_id integer,
round integer,
main_score real,
sub1_score real,
sub2_score real,
penalty real,
retire integer,
foreign key (group_id) references dantai_hokei_groups(id),
primary key(id));

create table tenkai_groups
(id integer not null,
group_id integer not null,
name text not null,
foreign key (group_id) references groups(id),
primary key(id));

create table tenkai
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
foreign key (group_id) references tenkai_groups(id),
primary key(id));

\copy dantai_hokei_groups from 'dantai_hokei_groups.csv' csv header;
\copy dantai_hokei from 'dantai_hokei.csv' csv header;
\copy tenkai_groups from 'tenkai_groups.csv' csv header;
\copy tenkai from 'tenkai.csv' csv header;

create table dantai_zissen_man_groups
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

\copy dantai_zissen_man_groups from 'dantai_zissen_man_groups.csv' csv header;
\copy dantai_zissen_man from 'dantai_zissen_man.csv' csv header;
