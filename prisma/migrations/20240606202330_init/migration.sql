-- CreateTable
CREATE TABLE "block_a" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "time_schedule" TEXT NOT NULL,
    "before_final" INTEGER NOT NULL,
    "final" INTEGER NOT NULL,
    "players_checked" INTEGER NOT NULL,
    "next_unused_num" INTEGER NOT NULL,

    CONSTRAINT "block_a_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_a_games" (
    "id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "block_a_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_b" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "time_schedule" TEXT NOT NULL,
    "before_final" INTEGER NOT NULL,
    "final" INTEGER NOT NULL,
    "players_checked" INTEGER NOT NULL,
    "next_unused_num" INTEGER NOT NULL,

    CONSTRAINT "block_b_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_b_games" (
    "id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "block_b_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_c" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "time_schedule" TEXT NOT NULL,
    "before_final" INTEGER NOT NULL,
    "final" INTEGER NOT NULL,
    "players_checked" INTEGER NOT NULL,
    "next_unused_num" INTEGER NOT NULL,

    CONSTRAINT "block_c_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_c_games" (
    "id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "block_c_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_d" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "time_schedule" TEXT NOT NULL,
    "before_final" INTEGER NOT NULL,
    "final" INTEGER NOT NULL,
    "players_checked" INTEGER NOT NULL,
    "next_unused_num" INTEGER NOT NULL,

    CONSTRAINT "block_d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_d_games" (
    "id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "block_d_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_type" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "court_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_block_a" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "current_block_a_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_block_b" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "current_block_b_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_block_c" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "current_block_c_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_block_d" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "current_block_d_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dantai" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "dantai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_type" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "existence" INTEGER NOT NULL,

    CONSTRAINT "event_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hokei_man" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "hokei_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hokei_sonen" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "hokei_sonen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hokei_woman" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "hokei_woman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_request" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "player_id" INTEGER,
    "group_id" INTEGER,
    "group_name" TEXT,
    "court_id" INTEGER NOT NULL,

    CONSTRAINT "notification_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_kana" TEXT NOT NULL,
    "zissen_man_player_id" INTEGER,
    "hokei_man_player_id" INTEGER,
    "zissen_woman_player_id" INTEGER,
    "hokei_woman_player_id" INTEGER,
    "hokei_sonen_player_id" INTEGER,
    "hokei_newcommer_player_id" INTEGER,
    "zissen_kyuui_man_player_id" INTEGER,
    "hokei_kyuui_man_player_id" INTEGER,
    "zissen_kyuui_woman_player_id" INTEGER,
    "hokei_kyuui_woman_player_id" INTEGER,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zissen_man" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "zissen_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zissen_woman" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "zissen_woman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dantai_zissen_man" (
    "id" INTEGER NOT NULL,
    "left_group_id" INTEGER,
    "right_group_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_group_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "dantai_zissen_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dantai_zissen_man_groups" (
    "id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "dantai_zissen_man_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dantai_zissen_woman" (
    "id" INTEGER NOT NULL,
    "left_group_id" INTEGER,
    "right_group_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_group_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "dantai_zissen_woman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dantai_zissen_woman_groups" (
    "id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "dantai_zissen_woman_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hokei_kyuui_man" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "hokei_kyuui_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hokei_kyuui_woman" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "hokei_kyuui_woman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hokei_newcommer" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "hokei_newcommer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zissen_kyuui_man" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "zissen_kyuui_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zissen_kyuui_woman" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "zissen_kyuui_woman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_x" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "time_schedule" TEXT NOT NULL,
    "before_final" INTEGER NOT NULL,
    "final" INTEGER NOT NULL,
    "players_checked" INTEGER NOT NULL,
    "next_unused_num" INTEGER NOT NULL,

    CONSTRAINT "block_x_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_x_games" (
    "id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "block_x_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_y" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "time_schedule" TEXT NOT NULL,
    "before_final" INTEGER NOT NULL,
    "final" INTEGER NOT NULL,
    "players_checked" INTEGER NOT NULL,
    "next_unused_num" INTEGER NOT NULL,

    CONSTRAINT "block_y_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_y_games" (
    "id" INTEGER NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "block_y_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_block_x" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "current_block_x_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_block_y" (
    "id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,

    CONSTRAINT "current_block_y_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_dantai" (
    "id" INTEGER NOT NULL,
    "event_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "test_dantai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_hokei_man" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "test_hokei_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_hokei_woman" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "test_hokei_woman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_notification_request" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "player_id" INTEGER,
    "group_id" INTEGER,
    "court_id" INTEGER NOT NULL,

    CONSTRAINT "test_notification_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_players" (
    "id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_kana" TEXT NOT NULL,
    "test_zissen_man_player_id" INTEGER,
    "test_hokei_man_player_id" INTEGER,
    "test_zissen_woman_player_id" INTEGER,
    "test_hokei_woman_player_id" INTEGER,
    "test_hokei_sonen_player_id" INTEGER,

    CONSTRAINT "test_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_zissen_man" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "test_zissen_man_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_zissen_woman" (
    "id" INTEGER NOT NULL,
    "left_player_id" INTEGER,
    "right_player_id" INTEGER,
    "next_left_id" INTEGER,
    "next_right_id" INTEGER,
    "left_player_flag" INTEGER,
    "left_retire" INTEGER,
    "right_retire" INTEGER,

    CONSTRAINT "test_zissen_woman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_request_player_id_key" ON "notification_request"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_zissen_man_player_id_key" ON "players"("zissen_man_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_hokei_man_player_id_key" ON "players"("hokei_man_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_zissen_woman_player_id_key" ON "players"("zissen_woman_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_hokei_woman_player_id_key" ON "players"("hokei_woman_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_hokei_sonen_player_id_key" ON "players"("hokei_sonen_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_hokei_newcommer_player_id_key" ON "players"("hokei_newcommer_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_zissen_kyuui_man_player_id_key" ON "players"("zissen_kyuui_man_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_hokei_kyuui_man_player_id_key" ON "players"("hokei_kyuui_man_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_zissen_kyuui_woman_player_id_key" ON "players"("zissen_kyuui_woman_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_hokei_kyuui_woman_player_id_key" ON "players"("hokei_kyuui_woman_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_notification_request_player_id_key" ON "test_notification_request"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_players_test_zissen_man_player_id_key" ON "test_players"("test_zissen_man_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_players_test_hokei_man_player_id_key" ON "test_players"("test_hokei_man_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_players_test_zissen_woman_player_id_key" ON "test_players"("test_zissen_woman_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_players_test_hokei_woman_player_id_key" ON "test_players"("test_hokei_woman_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_players_test_hokei_sonen_player_id_key" ON "test_players"("test_hokei_sonen_player_id");

-- AddForeignKey
ALTER TABLE "block_a" ADD CONSTRAINT "block_a_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_a_games" ADD CONSTRAINT "block_a_games_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "block_a"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_b" ADD CONSTRAINT "block_b_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_b_games" ADD CONSTRAINT "block_b_games_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "block_b"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_c" ADD CONSTRAINT "block_c_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_c_games" ADD CONSTRAINT "block_c_games_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "block_c"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_d" ADD CONSTRAINT "block_d_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_d_games" ADD CONSTRAINT "block_d_games_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "block_d"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "current_block_a" ADD CONSTRAINT "current_block_a_id_fkey" FOREIGN KEY ("id") REFERENCES "block_a"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "current_block_b" ADD CONSTRAINT "current_block_b_id_fkey" FOREIGN KEY ("id") REFERENCES "block_b"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "current_block_c" ADD CONSTRAINT "current_block_c_id_fkey" FOREIGN KEY ("id") REFERENCES "block_c"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "current_block_d" ADD CONSTRAINT "current_block_d_id_fkey" FOREIGN KEY ("id") REFERENCES "block_d"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai" ADD CONSTRAINT "dantai_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai" ADD CONSTRAINT "dantai_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_man" ADD CONSTRAINT "hokei_man_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("hokei_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_man" ADD CONSTRAINT "hokei_man_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("hokei_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_sonen" ADD CONSTRAINT "hokei_sonen_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("hokei_sonen_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_sonen" ADD CONSTRAINT "hokei_sonen_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("hokei_sonen_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_woman" ADD CONSTRAINT "hokei_woman_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("hokei_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_woman" ADD CONSTRAINT "hokei_woman_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("hokei_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_request" ADD CONSTRAINT "notification_request_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "court_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_request" ADD CONSTRAINT "notification_request_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_request" ADD CONSTRAINT "notification_request_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_man" ADD CONSTRAINT "zissen_man_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("zissen_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_man" ADD CONSTRAINT "zissen_man_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("zissen_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_woman" ADD CONSTRAINT "zissen_woman_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("zissen_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_woman" ADD CONSTRAINT "zissen_woman_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("zissen_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai_zissen_man" ADD CONSTRAINT "dantai_zissen_man_left_group_id_fkey" FOREIGN KEY ("left_group_id") REFERENCES "dantai_zissen_man_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai_zissen_man" ADD CONSTRAINT "dantai_zissen_man_right_group_id_fkey" FOREIGN KEY ("right_group_id") REFERENCES "dantai_zissen_man_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai_zissen_man_groups" ADD CONSTRAINT "dantai_zissen_man_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai_zissen_woman" ADD CONSTRAINT "dantai_zissen_woman_left_group_id_fkey" FOREIGN KEY ("left_group_id") REFERENCES "dantai_zissen_woman_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai_zissen_woman" ADD CONSTRAINT "dantai_zissen_woman_right_group_id_fkey" FOREIGN KEY ("right_group_id") REFERENCES "dantai_zissen_woman_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dantai_zissen_woman_groups" ADD CONSTRAINT "dantai_zissen_woman_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_kyuui_man" ADD CONSTRAINT "hokei_kyuui_man_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("hokei_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_kyuui_man" ADD CONSTRAINT "hokei_kyuui_man_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("hokei_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_kyuui_woman" ADD CONSTRAINT "hokei_kyuui_woman_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("hokei_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_kyuui_woman" ADD CONSTRAINT "hokei_kyuui_woman_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("hokei_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_newcommer" ADD CONSTRAINT "hokei_newcommer_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("hokei_newcommer_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hokei_newcommer" ADD CONSTRAINT "hokei_newcommer_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("hokei_newcommer_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_kyuui_man" ADD CONSTRAINT "zissen_kyuui_man_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("zissen_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_kyuui_man" ADD CONSTRAINT "zissen_kyuui_man_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("zissen_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_kyuui_woman" ADD CONSTRAINT "zissen_kyuui_woman_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "players"("zissen_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zissen_kyuui_woman" ADD CONSTRAINT "zissen_kyuui_woman_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "players"("zissen_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_x" ADD CONSTRAINT "block_x_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_x_games" ADD CONSTRAINT "block_x_games_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "block_x"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_y" ADD CONSTRAINT "block_y_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "block_y_games" ADD CONSTRAINT "block_y_games_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "block_y"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "current_block_x" ADD CONSTRAINT "current_block_x_id_fkey" FOREIGN KEY ("id") REFERENCES "block_x"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "current_block_y" ADD CONSTRAINT "current_block_y_id_fkey" FOREIGN KEY ("id") REFERENCES "block_y"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_dantai" ADD CONSTRAINT "test_dantai_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_dantai" ADD CONSTRAINT "test_dantai_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_hokei_man" ADD CONSTRAINT "test_hokei_man_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "test_players"("test_hokei_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_hokei_man" ADD CONSTRAINT "test_hokei_man_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "test_players"("test_hokei_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_hokei_woman" ADD CONSTRAINT "test_hokei_woman_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "test_players"("test_hokei_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_hokei_woman" ADD CONSTRAINT "test_hokei_woman_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "test_players"("test_hokei_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_notification_request" ADD CONSTRAINT "test_notification_request_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "court_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_notification_request" ADD CONSTRAINT "test_notification_request_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_notification_request" ADD CONSTRAINT "test_notification_request_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_notification_request" ADD CONSTRAINT "test_notification_request_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "test_players"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_players" ADD CONSTRAINT "test_players_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_zissen_man" ADD CONSTRAINT "test_zissen_man_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "test_players"("test_zissen_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_zissen_man" ADD CONSTRAINT "test_zissen_man_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "test_players"("test_zissen_man_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_zissen_woman" ADD CONSTRAINT "test_zissen_woman_left_player_id_fkey" FOREIGN KEY ("left_player_id") REFERENCES "test_players"("test_zissen_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "test_zissen_woman" ADD CONSTRAINT "test_zissen_woman_right_player_id_fkey" FOREIGN KEY ("right_player_id") REFERENCES "test_players"("test_zissen_woman_player_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
