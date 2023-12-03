CREATE TABLE tmp_test_hokei_woman AS SELECT * FROM test_hokei_woman WHERE false;
\COPY tmp_test_hokei_woman FROM 'test_hokei_woman.csv' WITH CSV HEADER;
UPDATE test_hokei_woman
SET left_player_id = tmp_test_hokei_woman.left_player_id,
    right_player_id = tmp_test_hokei_woman.right_player_id
FROM tmp_test_hokei_woman
WHERE test_hokei_woman.id = tmp_test_hokei_woman.id;
UPDATE test_hokei_woman SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_test_hokei_woman;

CREATE TABLE tmp_test_zissen_woman AS SELECT * FROM test_zissen_woman WHERE false;
\COPY tmp_test_zissen_woman FROM 'test_zissen_woman.csv' WITH CSV HEADER;
UPDATE test_zissen_woman
SET left_player_id = tmp_test_zissen_woman.left_player_id,
    right_player_id = tmp_test_zissen_woman.right_player_id
FROM tmp_test_zissen_woman
WHERE test_zissen_woman.id = tmp_test_zissen_woman.id;
UPDATE test_zissen_woman SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_test_zissen_woman;

CREATE TABLE tmp_block_y_games AS SELECT * FROM block_y_games WHERE false;
\COPY tmp_block_y_games FROM 'block_y_games.csv' WITH CSV HEADER;
UPDATE block_y_games
SET order_id = tmp_block_y_games.order_id
FROM tmp_block_y_games
WHERE block_y_games.id = tmp_block_y_games.id;
DROP TABLE tmp_block_y_games;

UPDATE current_block_y SET id = 1, game_id = 1;
UPDATE block_y SET players_checked = 0;

DELETE FROM notification_request;
