import { expect, Page, test } from "@playwright/test";

type CurrentSchedule = {
  id: number;
  game_id: number;
};

type Schedule = {
  id: number;
  event_id: number;
  name?: string;
  players_checked?: boolean | number;
  games?: number[];
};

type RecordPayload = {
  id: number;
  event_name: string;
  left_player_flag?: number;
  left_group_flag?: number;
};

type TableRecordPayload = {
  id: number;
  event_name: string;
  main_score?: number;
  sub1_score?: number;
  sub2_score?: number;
  sub3_score?: number;
  sub4_score?: number;
  sub5_score?: number;
  elapsed_time?: number;
  penalty?: number | null;
  start_penalty?: number | null;
};

function integer(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getJson<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(path);
  if (!response.ok()) {
    throw new Error(
      `${path} returned ${response.status()}: ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
}

async function currentSchedule(page: Page, court: string) {
  return getJson<CurrentSchedule>(
    page,
    `/api/current_schedule?block_number=${court}`,
  );
}

async function scheduleList(page: Page, court: string) {
  return getJson<Schedule[]>(
    page,
    `/api/get_time_schedule?block_number=${court}`,
  );
}

async function waitForApp(page: Page) {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get("/admin");
          return response.status();
        } catch {
          return 0;
        }
      },
      { timeout: 60_000, intervals: [500, 1_000, 2_000] },
    )
    .toBe(200);
}

async function authorizeRemoteNavigation(page: Page) {
  if (process.env.ALLOW_REMOTE_BASE_URL !== "1") {
    return;
  }

  const baseURL = process.env.BASE_URL;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  if (!baseURL || !username || !password) {
    throw new Error(
      "BASE_URL, USERNAME, and PASSWORD are required for remote execution.",
    );
  }

  const origin = new URL(baseURL).origin;
  const authorization = `Basic ${Buffer.from(
    `${username}:${password}`,
  ).toString("base64")}`;
  await page.route(`${origin}/**`, (route) =>
    route.continue({
      headers: { ...route.request().headers(), authorization },
    }),
  );
}

async function waitForRecordData(page: Page) {
  await expect(
    page.getByRole("heading", { name: /^第[1-9]\d*試合$/ }),
  ).toBeVisible({ timeout: 15_000 });
}

async function markEveryonePresent(page: Page) {
  const radios = page.locator('input[type="radio"]');
  await expect
    .poll(() => radios.count(), { timeout: 15_000 })
    .toBeGreaterThan(0);

  const count = await radios.count();
  if (count % 2 !== 0) {
    throw new Error(`Expected attendance radios in pairs, but found ${count}.`);
  }

  for (let index = 0; index < count; index += 2) {
    await radios.nth(index).check();
  }

  await Promise.all([
    page.waitForURL(/\/admin\/block\?block_number=/),
    page.getByRole("button", { name: "決定", exact: true }).first().click(),
  ]);
}

function tableEventName(eventId: number): string | null {
  const names: Record<number, string> = {
    8: "dantai_hokei_man",
    9: "dantai_hokei_woman",
    10: "tenkai_man",
    11: "tenkai_woman",
    18: "dantai_hokei",
    19: "tenkai",
    26: "dantai_hokei_newcommer",
  };
  return names[eventId] ?? null;
}

async function confirmPreliminaryTableResult(
  page: Page,
  court: string,
  schedule: Schedule,
) {
  const eventName = tableEventName(schedule.event_id);
  if (!eventName || !schedule.games?.length) {
    return;
  }

  const results = await getJson<Array<Record<string, unknown>>>(
    page,
    `/api/get_table_result?event_name=${encodeURIComponent(eventName)}`,
  );
  const scheduledGameIds = new Set(schedule.games.map(Number));
  const isPreliminary = results.some(
    (item) => scheduledGameIds.has(Number(item.id)) && item.is_final !== true,
  );
  if (!isPreliminary) {
    return;
  }

  console.log(
    `[advance-schedule] confirming preliminary result: event=${eventName}, schedule=${schedule.id}`,
  );
  await page.goto(
    `/admin/check_table_result?block_number=${court}&schedule_id=${schedule.id}&event_id=${schedule.event_id}`,
    { waitUntil: "domcontentloaded" },
  );
  const confirmButton = page.getByRole("button", {
    name: "結果確定",
    exact: true,
  });
  await expect(confirmButton).toBeVisible({ timeout: 15_000 });
  await Promise.all([
    page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    }),
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/confirm_table_result") &&
        response.request().method() === "POST" &&
        response.ok(),
    ),
    confirmButton.click(),
  ]);
  console.log(
    `[advance-schedule] preliminary result confirmed: event=${eventName}, schedule=${schedule.id}`,
  );
}

async function verifyTournamentRecord(page: Page, payload: RecordPayload) {
  const flagField = Object.hasOwn(payload, "left_group_flag")
    ? "left_group_flag"
    : "left_player_flag";
  const expectedFlag = payload[flagField];

  await expect
    .poll(
      async () => {
        const results = await getJson<Array<Record<string, unknown>>>(
          page,
          `/api/get_result?event_name=${encodeURIComponent(payload.event_name)}`,
        );
        const saved = results.find((item) => Number(item.id) === payload.id);
        const savedFlag = saved?.[flagField];
        return (
          savedFlag !== null &&
          savedFlag !== undefined &&
          Number(savedFlag) === Number(expectedFlag)
        );
      },
      { timeout: 15_000, intervals: [250, 500, 1_000] },
    )
    .toBe(true);
}

async function verifyTableRecord(page: Page, payload: TableRecordPayload) {
  const scoreFields: Array<keyof TableRecordPayload> = [
    "main_score",
    "sub1_score",
    "sub2_score",
    "sub3_score",
    "sub4_score",
    "sub5_score",
    "elapsed_time",
    "penalty",
    "start_penalty",
  ];
  const expectedFields = scoreFields.filter(
    (field) =>
      Object.hasOwn(payload, field) &&
      !(field === "start_penalty" && payload[field] === null),
  );

  await expect
    .poll(
      async () => {
        const results = await getJson<Array<Record<string, unknown>>>(
          page,
          `/api/get_table_result?event_name=${encodeURIComponent(payload.event_name)}`,
        );
        const saved = results.find((item) => Number(item.id) === payload.id);
        if (!saved) {
          return false;
        }
        return expectedFields.every((field) => {
          const expected = payload[field];
          const actual = saved[field];
          if (expected === null) {
            return actual === null;
          }
          return (
            actual !== null &&
            actual !== undefined &&
            Math.abs(Number(actual) - Number(expected)) < 0.0001
          );
        });
      },
      { timeout: 15_000, intervals: [250, 500, 1_000] },
    )
    .toBe(true);
}

async function recordTournamentGame(page: Page) {
  await expect(page.locator("#choice0")).toBeVisible({ timeout: 15_000 });
  const isHokei = await page.getByText("赤の旗", { exact: true }).isVisible();
  const choice = isHokei ? integer(0, 3) : integer(0, 1);
  const label = isHokei
    ? `赤旗${choice}本`
    : choice === 0
      ? "赤勝利"
      : "白勝利";

  const selectedChoice = page.locator(`#choice${choice}`);
  await selectedChoice.evaluate((element: HTMLInputElement) => element.click());
  await expect(selectedChoice).toBeChecked();
  const [, recordResponse] = await Promise.all([
    page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    }),
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/record") &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: "決定", exact: true }).first().click(),
  ]);

  if (!recordResponse.ok()) {
    throw new Error(
      `/api/record returned ${recordResponse.status()}: ${await recordResponse.text()}`,
    );
  }

  const payload = recordResponse.request().postDataJSON() as RecordPayload;
  await verifyTournamentRecord(page, payload);
  console.log(
    `[advance-schedule] verified saved result: event=${payload.event_name}, id=${payload.id}`,
  );

  return label;
}

async function fillTableScores(page: Page) {
  const inputs = page.locator('input[inputmode="numeric"]');
  await expect
    .poll(() => inputs.count(), { timeout: 15_000 })
    .toBeGreaterThan(0);
  const count = await inputs.count();

  let values: number[];
  if (count === 21) {
    values = [
      2,
      integer(5, 9),
      integer(0, 9),
      integer(0, 9),
      0,
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      0,
      0,
      0,
      0,
    ];
  } else if (count === 8) {
    values = [
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      integer(7, 9),
      integer(0, 9),
      0,
      0,
    ];
  } else {
    throw new Error(`Unexpected table score field count: ${count}.`);
  }

  for (let index = 0; index < values.length; index += 1) {
    await inputs.nth(index).fill(String(values[index]));
  }

  const [, recordResponse] = await Promise.all([
    page.waitForNavigation({
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    }),
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/record_table") &&
        response.request().method() === "POST",
    ),
    page.getByRole("button", { name: "決定", exact: true }).first().click(),
  ]);

  if (!recordResponse.ok()) {
    throw new Error(
      `/api/record_table returned ${recordResponse.status()}: ${await recordResponse.text()}`,
    );
  }

  const payload = recordResponse.request().postDataJSON() as TableRecordPayload;
  await verifyTableRecord(page, payload);
  console.log(
    `[advance-schedule] verified saved result: event=${payload.event_name}, id=${payload.id}`,
  );

  return values.join("");
}

test("指定コートの現在競技を完了し、次競技へ進める", async ({ page }) => {
  const court = (process.env.COURT ?? "").trim().toLowerCase();
  if (!/^[a-z]$/.test(court)) {
    throw new Error("COURT must be one letter, for example COURT=A.");
  }
  if ((process.env.CONFIRM_ADVANCE ?? "").trim().toLowerCase() !== court) {
    throw new Error(`CONFIRM_ADVANCE=${court.toUpperCase()} is required.`);
  }

  const expectedScheduleText = (process.env.EXPECTED_SCHEDULE_ID ?? "").trim();
  if (expectedScheduleText && !/^[1-9][0-9]*$/.test(expectedScheduleText)) {
    throw new Error("EXPECTED_SCHEDULE_ID must be a positive integer.");
  }
  const expectedScheduleId = expectedScheduleText
    ? Number.parseInt(expectedScheduleText, 10)
    : null;
  const advanceAllSchedules = process.env.ADVANCE_ALL_SCHEDULES === "1";
  if (advanceAllSchedules && expectedScheduleId !== null) {
    throw new Error(
      "ADVANCE_ALL_SCHEDULES cannot be combined with EXPECTED_SCHEDULE_ID.",
    );
  }
  console.log(`[advance-schedule] court=${court.toUpperCase()}`);

  await authorizeRemoteNavigation(page);
  await waitForApp(page);
  await page.goto("/admin");
  await page
    .getByRole("button", { name: `${court.toUpperCase()}コート`, exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/admin/block\\?block_number=${court}$`),
  );

  for (;;) {
    const initial = await currentSchedule(page, court);
    const schedules = await scheduleList(page, court);
    if (expectedScheduleId !== null && initial.id > expectedScheduleId) {
      const completedSchedule = schedules.find(
        (schedule) => schedule.id === expectedScheduleId,
      );
      if (completedSchedule) {
        await confirmPreliminaryTableResult(page, court, completedSchedule);
      }
      console.log(
        `[advance-schedule] skip: expected schedule=${expectedScheduleId} is already completed; current schedule=${initial.id}`,
      );
      return;
    }
    if (expectedScheduleId !== null && initial.id < expectedScheduleId) {
      throw new Error(
        `Court ${court.toUpperCase()} is behind the plan: expected schedule=${expectedScheduleId}, current schedule=${initial.id}.`,
      );
    }

    const target = schedules.find((schedule) => schedule.id === initial.id);
    if (!target || target.event_id <= 0) {
      if (advanceAllSchedules) {
        console.log(
          `[advance-schedule] completed all competitions for court=${court.toUpperCase()}`,
        );
        return;
      }
      throw new Error(
        `No playable current competition for court ${court.toUpperCase()}.`,
      );
    }

    const competitionName =
      target.name?.replace(/["']/g, "") || `event ${target.event_id}`;
    console.log(
      `[advance-schedule] current schedule=${initial.id}, game=${initial.game_id}, competition=${competitionName}`,
    );

    const currentRow = page.locator(
      `tr[data-schedule-id="${initial.id}"][data-current="true"]`,
    );
    await expect(currentRow).toBeVisible();

    if (!target.players_checked) {
      await currentRow
        .getByRole("button", { name: "点呼", exact: true })
        .click();
      await expect(page).toHaveURL(/\/admin\/check_players_on_block/);
      await markEveryonePresent(page);
      console.log("[advance-schedule] attendance completed");

      console.log(
        "[advance-schedule] waiting for attendance status to be visible",
      );
      await expect
        .poll(
          async () => {
            const updatedSchedules = await scheduleList(page, court);
            return Boolean(
              updatedSchedules.find((schedule) => schedule.id === initial.id)
                ?.players_checked,
            );
          },
          { timeout: 15_000, intervals: [250, 500, 1_000] },
        )
        .toBe(true);
      console.log("[advance-schedule] attendance status confirmed");
    } else {
      console.log("[advance-schedule] attendance was already completed");
    }

    console.log(
      `[advance-schedule] opening record screen for schedule=${initial.id}, game=${initial.game_id}`,
    );
    await page.goto(`/admin/block?block_number=${court}`, {
      waitUntil: "domcontentloaded",
    });
    const row = page.locator(
      `tr[data-schedule-id="${initial.id}"][data-current="true"]`,
    );
    const recordButton = row.getByRole("button", {
      name: "記録",
      exact: true,
    });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(recordButton).toBeEnabled({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/admin\/record_(?:table_)?result/, {
        timeout: 15_000,
      }),
      recordButton.click(),
    ]);
    console.log("[advance-schedule] record screen opened");

    const visitedPositions = new Set<string>();
    for (let recordedGames = 0; ; recordedGames += 1) {
      console.log(
        `[advance-schedule] checking current position before game ${recordedGames + 1}`,
      );
      const before = await currentSchedule(page, court);
      if (before.id !== initial.id) {
        await confirmPreliminaryTableResult(page, court, target);
        console.log(
          `[advance-schedule] completed ${competitionName}; next schedule=${before.id}`,
        );
        expect(before.id).toBe(initial.id + 1);
        break;
      }

      const position = `${before.id}:${before.game_id}`;
      if (visitedPositions.has(position)) {
        throw new Error(
          `Schedule ${initial.id} returned to an already processed position: ${position}.`,
        );
      }
      visitedPositions.add(position);

      await waitForRecordData(page);
      const result = page.url().includes("record_table_result")
        ? await fillTableScores(page)
        : await recordTournamentGame(page);

      await expect
        .poll(
          async () => {
            const current = await currentSchedule(page, court);
            return `${current.id}:${current.game_id}`;
          },
          { timeout: 15_000, intervals: [250, 500, 1_000] },
        )
        .not.toBe(`${before.id}:${before.game_id}`);

      console.log(
        `[advance-schedule] recorded game=${before.game_id}, result=${result}`,
      );
    }

    if (!advanceAllSchedules) {
      return;
    }
    await page.goto(`/admin/block?block_number=${court}`, {
      waitUntil: "domcontentloaded",
    });
  }
});
