CREATE TABLE tmp_test_hokei_man AS SELECT * FROM test_hokei_man WHERE false;
\COPY tmp_test_hokei_man FROM 'test_hokei_man.csv' WITH CSV HEADER;
UPDATE test_hokei_man
SET left_player_id = tmp_test_hokei_man.left_player_id,
    right_player_id = tmp_test_hokei_man.right_player_id
FROM tmp_test_hokei_man
WHERE test_hokei_man.id = tmp_test_hokei_man.id;
UPDATE test_hokei_man SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_test_hokei_man;

CREATE TABLE tmp_test_zissen_man AS SELECT * FROM test_zissen_man WHERE false;
\COPY tmp_test_zissen_man FROM 'test_zissen_man.csv' WITH CSV HEADER;
UPDATE test_zissen_man
SET left_player_id = tmp_test_zissen_man.left_player_id,
    right_player_id = tmp_test_zissen_man.right_player_id
FROM tmp_test_zissen_man
WHERE test_zissen_man.id = tmp_test_zissen_man.id;
UPDATE test_zissen_man SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_test_zissen_man;

CREATE TABLE tmp_block_x_games AS SELECT * FROM block_x_games WHERE false;
\COPY tmp_block_x_games FROM 'block_x_games.csv' WITH CSV HEADER;
UPDATE block_x_games
SET order_id = tmp_block_x_games.order_id
FROM tmp_block_x_games
WHERE block_x_games.id = tmp_block_x_games.id;
DROP TABLE tmp_block_x_games;

UPDATE current_block_x SET id = 1, game_id = 1;
UPDATE block_x SET players_checked = 0;

DELETE FROM notification_request;
