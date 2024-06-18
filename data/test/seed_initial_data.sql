insert into court_type(id,name) values (100, 'Xコート');
insert into court_type(id,name) values (101, 'Yコート');

\COPY block_x from 'block_x.csv' csv header;
\COPY block_x_games from 'block_x_games.csv' csv header;
insert into current_block_x(id, game_id) values (1, 1);

\COPY block_y from 'block_y.csv' csv header;
\COPY block_y_games from 'block_y_games.csv' csv header;
insert into current_block_y(id, game_id) values (1, 1);

\COPY test_players from 'test_players.csv' csv header;
\COPY test_hokei_man from 'test_hokei_man.csv' csv header;
\COPY test_zissen_man from 'test_zissen_man.csv' csv header;
\COPY test_hokei_woman from 'test_hokei_woman.csv' csv header;
\COPY test_zissen_woman from 'test_zissen_woman.csv' csv header;

\COPY test_dantai from 'test_dantai.csv' csv header;
