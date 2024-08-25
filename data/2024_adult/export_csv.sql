\copy (SELECT * FROM hokei_woman) to 'hokei_woman.csv' with csv header;
\copy (SELECT * FROM zissen_woman) to 'zissen_woman.csv' with csv header;
\copy (SELECT * FROM hokei_man) to 'hokei_man.csv' with csv header;
\copy (SELECT * FROM zissen_man) to 'zissen_man.csv' with csv header;
\copy (SELECT * FROM hokei_kyuui) to 'hokei_kyuui.csv' with csv header;
\copy (SELECT * FROM hokei_newcommer) to 'hokei_newcommer.csv' with csv header;
\copy (SELECT * FROM zissen_sonen_man) to 'zissen_sonen_man.csv' with csv header;
\copy (SELECT * FROM zissen_sonen_woman) to 'zissen_sonen_woman.csv' with csv header;
\copy (SELECT * FROM hokei_mei) to 'hokei_mei.csv' with csv header;
\copy (SELECT * FROM hokei_mei_kyuui_newcommer) to 'hokei_mei_kyuui_newcommer.csv' with csv header;
\copy (SELECT * FROM hokei_sei) to 'hokei_sei.csv' with csv header;

\copy (SELECT * FROM dantai_hokei) to 'dantai_hokei.csv' with csv header;
\copy (SELECT * FROM tenkai) to 'tenkai.csv' with csv header;


\copy (SELECT * FROM block_a) to 'block_a.csv' with csv header;
\copy (SELECT * FROM block_b) to 'block_b.csv' with csv header;
\copy (SELECT * FROM block_c) to 'block_c.csv' with csv header;
\copy (SELECT * FROM block_d) to 'block_d.csv' with csv header;

\copy (SELECT * FROM current_block_a) to 'current_block_a.csv' with csv header;
\copy (SELECT * FROM current_block_b) to 'current_block_b.csv' with csv header;
\copy (SELECT * FROM current_block_c) to 'current_block_c.csv' with csv header;
\copy (SELECT * FROM current_block_d) to 'current_block_d.csv' with csv header;
