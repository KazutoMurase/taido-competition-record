\copy groups from 'groups.csv' csv header;
\copy event_type from 'event_type.csv' csv header;
\copy court_type from 'court_type.csv' csv header;
\copy players from 'players.csv' csv header;

\copy hokei_man from 'hokei_man.csv' csv header;
\copy zissen_man from 'zissen_man.csv' csv header;
\copy hokei_woman from 'hokei_woman.csv' csv header;
\copy zissen_woman from 'zissen_woman.csv' csv header;
\copy hokei_sonen from 'hokei_sonen.csv' csv header;
\copy hokei_newcommer from 'hokei_newcommer.csv' csv header;
\copy hokei_kyuui_man from 'hokei_man.csv' csv header;
\copy zissen_kyuui_man from 'zissen_man.csv' csv header;
\copy hokei_kyuui_woman from 'hokei_woman.csv' csv header;
\copy zissen_kyuui_woman from 'zissen_woman.csv' csv header;

\copy dantai_zissen_man_groups from 'dantai_zissen_man_groups.csv' csv header;
\copy dantai_zissen_woman_groups from 'dantai_zissen_woman_groups.csv' csv header;

\copy dantai_zissen_man from 'dantai_zissen_man.csv' csv header;
\copy dantai_zissen_woman from 'dantai_zissen_woman.csv' csv header;

\copy block_a from 'block_a.csv' csv header;
\copy block_a_games from 'block_a_games.csv' csv header;

insert into current_block_a(id, game_id) values (1, 1);

\copy block_b from 'block_b.csv' csv header;
\copy block_b_games from 'block_b_games.csv' csv header;

insert into current_block_b(id, game_id) values (1, 1);

\copy block_c from 'block_c.csv' csv header;
\copy block_c_games from 'block_c_games.csv' csv header;

insert into current_block_c(id, game_id) values (1, 1);

\copy block_d from 'block_d.csv' csv header;
\copy block_d_games from 'block_d_games.csv' csv header;

insert into current_block_d(id, game_id) values (1, 1);

\COPY dantai from 'dantai.csv' csv header;
