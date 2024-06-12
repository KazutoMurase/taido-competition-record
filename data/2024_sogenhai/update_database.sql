CREATE TABLE tmp_hokei_woman AS SELECT * FROM hokei_woman WHERE false;
\COPY tmp_hokei_woman FROM 'hokei_woman.csv' WITH CSV HEADER;
UPDATE hokei_woman
SET left_player_id = tmp_hokei_woman.left_player_id,
    right_player_id = tmp_hokei_woman.right_player_id,
    next_left_id = tmp_hokei_woman.next_left_id,
    next_right_id = tmp_hokei_woman.next_right_id
FROM tmp_hokei_woman
WHERE hokei_woman.id = tmp_hokei_woman.id;
DROP TABLE tmp_hokei_woman;

CREATE TABLE tmp_zissen_woman AS SELECT * FROM zissen_woman WHERE false;
\COPY tmp_zissen_woman FROM 'zissen_woman.csv' WITH CSV HEADER;
UPDATE zissen_woman
SET left_player_id = tmp_zissen_woman.left_player_id,
    right_player_id = tmp_zissen_woman.right_player_id,
    next_left_id = tmp_zissen_woman.next_left_id,
    next_right_id = tmp_zissen_woman.next_right_id
FROM tmp_zissen_woman
WHERE zissen_woman.id = tmp_zissen_woman.id;
DROP TABLE tmp_zissen_woman;

CREATE TABLE tmp_hokei_man AS SELECT * FROM hokei_man WHERE false;
\COPY tmp_hokei_man FROM 'hokei_man.csv' WITH CSV HEADER;
UPDATE hokei_man
SET left_player_id = tmp_hokei_man.left_player_id,
    right_player_id = tmp_hokei_man.right_player_id,
    next_left_id = tmp_hokei_man.next_left_id,
    next_right_id = tmp_hokei_man.next_right_id
FROM tmp_hokei_man
WHERE hokei_man.id = tmp_hokei_man.id;
DROP TABLE tmp_hokei_man;

CREATE TABLE tmp_zissen_kyuui_man AS SELECT * FROM zissen_kyuui_man WHERE false;
\COPY tmp_zissen_kyuui_man FROM 'zissen_kyuui_man.csv' WITH CSV HEADER;
UPDATE zissen_kyuui_man
SET left_player_id = tmp_zissen_kyuui_man.left_player_id,
    right_player_id = tmp_zissen_kyuui_man.right_player_id,
    next_left_id = tmp_zissen_kyuui_man.next_left_id,
    next_right_id = tmp_zissen_kyuui_man.next_right_id
FROM tmp_zissen_kyuui_man
WHERE zissen_kyuui_man.id = tmp_zissen_kyuui_man.id;
UPDATE zissen_kyuui_man SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_zissen_kyuui_man;

CREATE TABLE tmp_hokei_kyuui_woman AS SELECT * FROM hokei_kyuui_woman WHERE false;
\COPY tmp_hokei_kyuui_woman FROM 'hokei_kyuui_woman.csv' WITH CSV HEADER;
UPDATE hokei_kyuui_woman
SET left_player_id = tmp_hokei_kyuui_woman.left_player_id,
    right_player_id = tmp_hokei_kyuui_woman.right_player_id,
    next_left_id = tmp_hokei_kyuui_woman.next_left_id,
    next_right_id = tmp_hokei_kyuui_woman.next_right_id
FROM tmp_hokei_kyuui_woman
WHERE hokei_kyuui_woman.id = tmp_hokei_kyuui_woman.id;
DROP TABLE tmp_hokei_kyuui_woman;

CREATE TABLE tmp_zissen_kyuui_woman AS SELECT * FROM zissen_kyuui_woman WHERE false;
\COPY tmp_zissen_kyuui_woman FROM 'zissen_kyuui_woman.csv' WITH CSV HEADER;
UPDATE zissen_kyuui_woman
SET left_player_id = tmp_zissen_kyuui_woman.left_player_id,
    right_player_id = tmp_zissen_kyuui_woman.right_player_id,
    next_left_id = tmp_zissen_kyuui_woman.next_left_id,
    next_right_id = tmp_zissen_kyuui_woman.next_right_id
FROM tmp_zissen_kyuui_woman
WHERE zissen_kyuui_woman.id = tmp_zissen_kyuui_woman.id;
DROP TABLE tmp_zissen_kyuui_woman;

CREATE TABLE tmp_hokei_kyuui_man AS SELECT * FROM hokei_kyuui_man WHERE false;
\COPY tmp_hokei_kyuui_man FROM 'hokei_kyuui_man.csv' WITH CSV HEADER;
UPDATE hokei_kyuui_man
SET left_player_id = tmp_hokei_kyuui_man.left_player_id,
    right_player_id = tmp_hokei_kyuui_man.right_player_id,
    next_left_id = tmp_hokei_kyuui_man.next_left_id,
    next_right_id = tmp_hokei_kyuui_man.next_right_id
FROM tmp_hokei_kyuui_man
WHERE hokei_kyuui_man.id = tmp_hokei_kyuui_man.id;
DROP TABLE tmp_hokei_kyuui_man;

CREATE TABLE tmp_zissen_kyuui_man AS SELECT * FROM zissen_kyuui_man WHERE false;
\COPY tmp_zissen_kyuui_man FROM 'zissen_kyuui_man.csv' WITH CSV HEADER;
UPDATE zissen_kyuui_man
SET left_player_id = tmp_zissen_kyuui_man.left_player_id,
    right_player_id = tmp_zissen_kyuui_man.right_player_id,
    next_left_id = tmp_zissen_kyuui_man.next_left_id,
    next_right_id = tmp_zissen_kyuui_man.next_right_id
FROM tmp_zissen_kyuui_man
WHERE zissen_kyuui_man.id = tmp_zissen_kyuui_man.id;
UPDATE zissen_kyuui_man SET left_player_flag=null, left_retire=null, right_retire=null;
DROP TABLE tmp_zissen_kyuui_man;

CREATE TABLE tmp_hokei_newcommer AS SELECT * FROM hokei_newcommer WHERE false;
\COPY tmp_hokei_newcommer FROM 'hokei_newcommer.csv' WITH CSV HEADER;
UPDATE hokei_newcommer
SET left_player_id = tmp_hokei_newcommer.left_player_id,
    right_player_id = tmp_hokei_newcommer.right_player_id,
    next_left_id = tmp_hokei_newcommer.next_left_id,
    next_right_id = tmp_hokei_newcommer.next_right_id
FROM tmp_hokei_newcommer
WHERE hokei_newcommer.id = tmp_hokei_newcommer.id;
DROP TABLE tmp_hokei_newcommer;

CREATE TABLE tmp_block_a AS SELECT * FROM block_a WHERE false;
\COPY tmp_block_a FROM 'block_a.csv' WITH CSV HEADER;
UPDATE block_a
SET time_schedule = tmp_block_a.time_schedule,
    event_id = tmp_block_a.event_id,
    before_final = tmp_block_a.before_final,
    final = tmp_block_a.final,
    next_unused_num = tmp_block_a.next_unused_num
FROM tmp_block_a
WHERE block_a.id = tmp_block_a.id;
DROP TABLE tmp_block_a;

CREATE TABLE tmp_block_b AS SELECT * FROM block_b WHERE false;
\COPY tmp_block_b FROM 'block_b.csv' WITH CSV HEADER;
UPDATE block_b
SET time_schedule = tmp_block_b.time_schedule,
    event_id = tmp_block_b.event_id,
    before_final = tmp_block_b.before_final,
    final = tmp_block_b.final,
    next_unused_num = tmp_block_b.next_unused_num
FROM tmp_block_b
WHERE block_b.id = tmp_block_b.id;
DROP TABLE tmp_block_b;

CREATE TABLE tmp_block_c AS SELECT * FROM block_c WHERE false;
\COPY tmp_block_c FROM 'block_c.csv' WITH CSV HEADER;
UPDATE block_c
SET time_schedule = tmp_block_c.time_schedule,
    event_id = tmp_block_c.event_id,
    before_final = tmp_block_c.before_final,
    final = tmp_block_c.final,
    next_unused_num = tmp_block_c.next_unused_num
FROM tmp_block_c
WHERE block_c.id = tmp_block_c.id;
DROP TABLE tmp_block_c;

CREATE TABLE tmp_block_d AS SELECT * FROM block_d WHERE false;
\COPY tmp_block_d FROM 'block_d.csv' WITH CSV HEADER;
UPDATE block_d
SET time_schedule = tmp_block_d.time_schedule,
    event_id = tmp_block_d.event_id,
    before_final = tmp_block_d.before_final,
    final = tmp_block_d.final,
    next_unused_num = tmp_block_d.next_unused_num
FROM tmp_block_d
WHERE block_d.id = tmp_block_d.id;
DROP TABLE tmp_block_d;
