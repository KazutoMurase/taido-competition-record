CREATE TABLE tmp_hokei_woman AS SELECT * FROM hokei_woman WHERE false;
\COPY tmp_hokei_woman FROM 'hokei_woman.csv' WITH CSV HEADER;
UPDATE hokei_woman
SET left_player_id = tmp_hokei_woman.left_player_id,
    right_player_id = tmp_hokei_woman.right_player_id
FROM tmp_hokei_woman
WHERE hokei_woman.id = tmp_hokei_woman.id;
UPDATE hokei_woman SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_hokei_woman;

CREATE TABLE tmp_zissen_woman AS SELECT * FROM zissen_woman WHERE false;
\COPY tmp_zissen_woman FROM 'zissen_woman.csv' WITH CSV HEADER;
UPDATE zissen_woman
SET left_player_id = tmp_zissen_woman.left_player_id,
    right_player_id = tmp_zissen_woman.right_player_id
FROM tmp_zissen_woman
WHERE zissen_woman.id = tmp_zissen_woman.id;
UPDATE zissen_woman SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_zissen_woman;

CREATE TABLE tmp_hokei_man AS SELECT * FROM hokei_man WHERE false;
\COPY tmp_hokei_man FROM 'hokei_man.csv' WITH CSV HEADER;
UPDATE hokei_man
SET left_player_id = tmp_hokei_man.left_player_id,
    right_player_id = tmp_hokei_man.right_player_id
FROM tmp_hokei_man
WHERE hokei_man.id = tmp_hokei_man.id;
UPDATE hokei_man SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_hokei_man;

CREATE TABLE tmp_zissen_man AS SELECT * FROM zissen_man WHERE false;
\COPY tmp_zissen_man FROM 'zissen_man.csv' WITH CSV HEADER;
UPDATE zissen_man
SET left_player_id = tmp_zissen_man.left_player_id,
    right_player_id = tmp_zissen_man.right_player_id
FROM tmp_zissen_man
WHERE zissen_man.id = tmp_zissen_man.id;
UPDATE zissen_man SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_zissen_man;

CREATE TABLE tmp_hokei_sonen AS SELECT * FROM hokei_sonen WHERE false;
\COPY tmp_hokei_sonen FROM 'hokei_sonen.csv' WITH CSV HEADER;
UPDATE hokei_sonen
SET left_player_id = tmp_hokei_sonen.left_player_id,
    right_player_id = tmp_hokei_sonen.right_player_id
FROM tmp_hokei_sonen
WHERE hokei_sonen.id = tmp_hokei_sonen.id;
UPDATE hokei_sonen SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_hokei_sonen;


CREATE TABLE tmp_block_a_games AS SELECT * FROM block_a_games WHERE false;
\COPY tmp_block_a_games FROM 'block_a_games.csv' WITH CSV HEADER;
UPDATE block_a_games
SET order_id = tmp_block_a_games.order_id
FROM tmp_block_a_games
WHERE block_a_games.id = tmp_block_a_games.id;
DROP TABLE tmp_block_a_games;

CREATE TABLE tmp_block_b_games AS SELECT * FROM block_b_games WHERE false;
\COPY tmp_block_b_games FROM 'block_b_games.csv' WITH CSV HEADER;
UPDATE block_b_games
SET order_id = tmp_block_b_games.order_id
FROM tmp_block_b_games
WHERE block_b_games.id = tmp_block_b_games.id;
DROP TABLE tmp_block_b_games;

CREATE TABLE tmp_block_c_games AS SELECT * FROM block_c_games WHERE false;
\COPY tmp_block_c_games FROM 'block_c_games.csv' WITH CSV HEADER;
UPDATE block_c_games
SET order_id = tmp_block_c_games.order_id
FROM tmp_block_c_games
WHERE block_c_games.id = tmp_block_c_games.id;
DROP TABLE tmp_block_c_games;

CREATE TABLE tmp_block_d_games AS SELECT * FROM block_d_games WHERE false;
\COPY tmp_block_d_games FROM 'block_d_games.csv' WITH CSV HEADER;
UPDATE block_d_games
SET order_id = tmp_block_d_games.order_id
FROM tmp_block_d_games
WHERE block_d_games.id = tmp_block_d_games.id;
DROP TABLE tmp_block_d_games;


UPDATE current_block_a SET id = 1, game_id = 1;
UPDATE block_a SET players_checked = 0;

UPDATE current_block_b SET id = 1, game_id = 1;
UPDATE block_b SET players_checked = 0;

UPDATE current_block_c SET id = 1, game_id = 1;
UPDATE block_c SET players_checked = 0;

UPDATE current_block_d SET id = 1, game_id = 1;
UPDATE block_d SET players_checked = 0;
DELETE FROM notification_request;
