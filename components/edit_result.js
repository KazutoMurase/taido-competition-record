import { useEffect, useState, useCallback } from "react";
import React from "react";
React.useLayoutEffect = React.useEffect;
import { useRouter } from "next/router";
import axios from "axios";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { Layer, Stage, Rect, Text, Group } from "react-konva";
import Grid from "@mui/material/Grid";
import Summary from "./show_summary";

function CreateDantaiText(item, lineWidth, y_padding, hide = false) {
  const is_left = item["block_pos"] === "left";
  const is_right = item["block_pos"] === "right";
  const has_left = "has_left" in item;
  const has_right = "has_right" in item;
  if (is_left || is_right) {
    if (!has_left && !has_right) {
      return (
        <>
          <Text
            x={is_left ? 10 : 630}
            y={item["left_begin_y"] - 5 + y_padding}
            text={item["left_group_name"].replace("'", "").replace("'", "")}
            fontSize={item["left_group_name"].length < 8 ? 18 : 14}
            width={200}
            align={is_left ? "right" : "left"}
          />
          <Rect
            x={is_left ? 130 : 625}
            y={item["left_begin_y"] + 2 + y_padding}
            width={["left_group_name"].length * 80}
            height={1}
            fill="black"
            visible={"left_out" in item}
          />
          <Text
            x={is_left ? 10 : 630}
            y={item["right_begin_y"] - 5 + y_padding}
            text={item["right_group_name"].replace("'", "").replace("'", "")}
            fontSize={item["right_group_name"].length < 8 ? 18 : 14}
            width={200}
            align={is_left ? "right" : "left"}
          />
          <Rect
            x={is_left ? 130 : 625}
            y={item["right_begin_y"] + y_padding}
            width={["right_group_name"].length * 80}
            height={1}
            fill="black"
            visible={"right_out" in item}
          />
        </>
      );
    }
    if (!has_left) {
      return (
        <>
          <Text
            x={is_left ? 10 : 630}
            y={item["left_begin_y"] - 5 + y_padding}
            text={item["left_group_name"].replace("'", "").replace("'", "")}
            fontSize={item["left_group_name"].length < 8 ? 18 : 14}
            width={200}
            align={is_left ? "right" : "left"}
          />
          <Rect
            x={is_left ? 130 : 625}
            y={item["left_begin_y"] + 2 + y_padding}
            width={["left_group_name"].length * 80}
            height={1}
            fill="black"
            visible={"left_out" in item}
          />
        </>
      );
    }
    if (!has_right) {
      return (
        <>
          <Text
            x={is_left ? 10 : 630}
            y={item["right_begin_y"] - 5 + y_padding}
            text={item["right_group_name"].replace("'", "").replace("'", "")}
            fontSize={item["right_group_name"].length < 8 ? 18 : 14}
            width={200}
            align={is_left ? "right" : "left"}
          />
          <Rect
            x={is_left ? 130 : 625}
            y={item["right_begin_y"] + 2 + y_padding}
            width={["right_group_name"].length * 80}
            height={1}
            fill="black"
            visible={"right_out" in item}
          />
        </>
      );
    }
  } else if ("fake_round" in item) {
    const x = 150 + lineWidth + (item["fake_round"] - 2) * 30;
    const width =
      690 -
      lineWidth -
      (item["fake_round"] - 2) * 30 -
      (220 + lineWidth + (item["fake_round"] - 2) * 30);
    return (
      <>
        <Text
          x={x - 80}
          y={item["left_begin_y"] - 10 + y_padding}
          text={
            hide
              ? ""
              : item["left_group_name"]?.replace("'", "").replace("'", "")
          }
          fontSize={
            (item["left_group_name"] !== null &&
              item["left_group_name"].length) < 8
              ? 18
              : 14
          }
        />
        <Text
          x={x + width + 10}
          y={item["left_begin_y"] - 10 + y_padding}
          text={
            hide
              ? ""
              : item["right_group_name"]?.replace("'", "").replace("'", "")
          }
          fontSize={
            (item["right_group_name"] !== null &&
              item["right_group_name"].length) < 8
              ? 18
              : 14
          }
        />
      </>
    );
  }
  return <></>;
}

function GetSplitName(name) {
  if (!name) {
    return name;
  }
  if (name.length > 9) {
    return name.slice(0, 9) + "\n" + name.slice(9);
  }
  return name;
}

function GetGroupNameWithBracket(group_name) {
  if (group_name === "''") {
    return "";
  }
  return group_name.replace(/['"]+/s, "【").replace(/['"]+/s, "】");
}

function GetGroupNameFontSize(group_name) {
  if (!group_name) {
    return 10;
  }
  if (group_name.length < 8) {
    return 14;
  }
  if (group_name.length < 9) {
    return 13;
  }
  if (group_name.length < 10) {
    return 12;
  }
  return 10;
}

function CreateText(
  item,
  lineWidth,
  y_padding,
  hide = false,
  currentBlockDataArray = null,
  blinkState = true,
  textPositions = {},
  onTextDrag = null,
  showIds = true,
  groupNameStates = {},
  onGroupNameClick = null,
  getDistrictColor = null,
) {
  const is_left = item["block_pos"] === "left";
  const is_right = item["block_pos"] === "right";
  const has_left = "has_left" in item;
  const has_right = "has_right" in item;

  let isLeftPlayerCurrent = false;
  let isRightPlayerCurrent = false;
  if (currentBlockDataArray && Array.isArray(currentBlockDataArray)) {
    for (const currentBlockItem of currentBlockDataArray) {
      if (
        currentBlockItem &&
        item["left_name"] &&
        (item["left_name"] === currentBlockItem.left_name ||
          item["left_name"] === currentBlockItem.right_name)
      ) {
        isLeftPlayerCurrent = true;
      }
      if (
        currentBlockItem &&
        item["right_name"] &&
        (item["right_name"] === currentBlockItem.left_name ||
          item["right_name"] === currentBlockItem.right_name)
      ) {
        isRightPlayerCurrent = true;
      }
    }
  }
  if (is_left || is_right) {
    if (!has_left && !has_right) {
      const leftGroupKey = `left_${item["id"]}`;
      const rightGroupKey = `right_${item["id"]}`;
      const leftPos = textPositions[leftGroupKey] || { x: 0, y: 0 };
      const rightPos = textPositions[rightGroupKey] || { x: 0, y: 0 };

      return (
        <>
          <Group
            x={leftPos.x}
            y={leftPos.y}
            draggable={true}
            onDragEnd={(e) => {
              if (onTextDrag) {
                onTextDrag(leftGroupKey, { x: e.target.x(), y: e.target.y() });
              }
            }}
          >
            <Text
              x={is_left ? 0 : 630}
              y={item["left_begin_y"] - 20 + y_padding}
              text={item["left_name_kana"]}
              fontSize={10}
            />
            <Rect
              x={is_left ? 0 : 625}
              y={item["left_begin_y"] - 16 + y_padding}
              width={["left_name_kana"].length * 110}
              height={1}
              fill="black"
              visible={"left_out" in item}
            />
            <Text
              x={is_left ? 0 : 630}
              y={item["left_begin_y"] - 7 + y_padding}
              text={GetSplitName(item["left_name"])}
              fontSize={item["left_name"].length < 8 ? 18 : 14}
              fill={isLeftPlayerCurrent ? "#ff5722" : "black"}
              fontStyle={isLeftPlayerCurrent ? "bold" : "normal"}
            />
            <Rect
              x={is_left ? 0 : 625}
              y={item["left_begin_y"] + 2 + y_padding}
              width={["left_name"].length * 110}
              height={1}
              fill="black"
              visible={"left_out" in item}
            />
            <Text
              x={is_left ? 120 : 750}
              y={item["left_begin_y"] - 2 + y_padding}
              text={GetGroupNameWithBracket(item["left_group_name"])}
              fontSize={GetGroupNameFontSize(item["left_group_name"])}
              fill={
                groupNameStates[item["left_group_name"]] === 1 ? "red" : "black"
              }
              visible={groupNameStates[item["left_group_name"]] !== 3}
              onClick={() =>
                onGroupNameClick && onGroupNameClick(item["left_group_name"])
              }
              onTap={() =>
                onGroupNameClick && onGroupNameClick(item["left_group_name"])
              }
            />
            {groupNameStates[item["left_group_name"]] === 2 && (
              <Rect
                x={is_left ? 120 : 750}
                y={item["left_begin_y"] - 7 + y_padding}
                width={item["left_group_name"].length * 10 + 20}
                height={20}
                fill={
                  getDistrictColor && getDistrictColor(item["left_group_name"])
                }
                opacity={0.5}
                onClick={() =>
                  onGroupNameClick && onGroupNameClick(item["left_group_name"])
                }
                onTap={() =>
                  onGroupNameClick && onGroupNameClick(item["left_group_name"])
                }
              />
            )}
            <Rect
              x={is_left ? 120 : 750}
              y={item["left_begin_y"] + 5 + y_padding}
              width={["left_group_name"].length * 80}
              height={1}
              fill="black"
              visible={"left_out" in item && item["left_group_name"] !== "''"}
            />
            <Text
              x={is_left ? 100 : 730}
              y={item["left_begin_y"] - 15 + y_padding}
              text={`団体内ランク${(item["id"] % 4) + 1}位`}
              fontSize={12}
              fill="blue"
              fontStyle="bold"
              visible={showIds}
            />
          </Group>
          <Group
            x={rightPos.x}
            y={rightPos.y}
            draggable={true}
            onDragEnd={(e) => {
              if (onTextDrag) {
                onTextDrag(rightGroupKey, { x: e.target.x(), y: e.target.y() });
              }
            }}
          >
            <Text
              x={is_left ? 0 : 630}
              y={item["right_begin_y"] - 20 + y_padding}
              text={item["right_name_kana"]}
              fontSize={10}
            />
            <Rect
              x={is_left ? 0 : 625}
              y={item["right_begin_y"] - 18 + y_padding}
              width={["right_name_kana"].length * 110}
              height={1}
              fill="black"
              visible={"right_out" in item}
            />
            <Text
              x={is_left ? 0 : 630}
              y={item["right_begin_y"] - 7 + y_padding}
              text={GetSplitName(item["right_name"])}
              fontSize={item["right_name"].length < 8 ? 18 : 14}
              fill={isRightPlayerCurrent ? "#ff5722" : "black"}
              fontStyle={isRightPlayerCurrent ? "bold" : "normal"}
            />
            <Rect
              x={is_left ? 0 : 625}
              y={item["right_begin_y"] + y_padding}
              width={["right_name"].length * 110}
              height={1}
              fill="black"
              visible={"right_out" in item}
            />
            <Text
              x={is_left ? 120 : 750}
              y={item["right_begin_y"] - 2 + y_padding}
              text={GetGroupNameWithBracket(item["right_group_name"])}
              fontSize={GetGroupNameFontSize(item["right_group_name"])}
              fill={
                groupNameStates[item["right_group_name"]] === 1
                  ? "red"
                  : "black"
              }
              visible={groupNameStates[item["right_group_name"]] !== 3}
              onClick={() =>
                onGroupNameClick && onGroupNameClick(item["right_group_name"])
              }
              onTap={() =>
                onGroupNameClick && onGroupNameClick(item["right_group_name"])
              }
            />
            {groupNameStates[item["right_group_name"]] === 2 && (
              <Rect
                x={is_left ? 120 : 750}
                y={item["right_begin_y"] - 7 + y_padding}
                width={item["right_group_name"].length * 10 + 20}
                height={20}
                fill={
                  getDistrictColor && getDistrictColor(item["right_group_name"])
                }
                opacity={0.5}
                onClick={() =>
                  onGroupNameClick && onGroupNameClick(item["right_group_name"])
                }
                onTap={() =>
                  onGroupNameClick && onGroupNameClick(item["right_group_name"])
                }
              />
            )}
            <Rect
              x={is_left ? 120 : 750}
              y={item["right_begin_y"] + 5 + y_padding}
              width={["right_group_name"].length * 80}
              height={1}
              fill="black"
              visible={"right_out" in item && item["right_group_name"] !== "''"}
            />
            <Text
              x={is_left ? 100 : 730}
              y={item["right_begin_y"] - 15 + y_padding}
              text={`団体内ランク${(item["id"] % 4) + 1}位`}
              fontSize={12}
              fill="red"
              fontStyle="bold"
              visible={showIds}
            />
          </Group>
        </>
      );
    }
    if (!has_left) {
      const leftGroupKey = `left_only_${item["id"]}`;
      const leftPos = textPositions[leftGroupKey] || { x: 0, y: 0 };

      return (
        <Group
          x={leftPos.x}
          y={leftPos.y}
          draggable={true}
          onDragEnd={(e) => {
            if (onTextDrag) {
              onTextDrag(leftGroupKey, { x: e.target.x(), y: e.target.y() });
            }
          }}
        >
          <Text
            x={is_left ? 0 : 630}
            y={item["left_begin_y"] - 20 + y_padding}
            text={item["left_name_kana"]}
            fontSize={10}
          />
          <Rect
            x={is_left ? 0 : 625}
            y={item["left_begin_y"] - 16 + y_padding}
            width={["left_name_kana"].length * 110}
            height={1}
            fill="black"
            visible={"left_out" in item}
          />
          <Text
            x={is_left ? 0 : 630}
            y={item["left_begin_y"] - 7 + y_padding}
            text={GetSplitName(item["left_name"])}
            fontSize={item["left_name"].length < 8 ? 18 : 14}
            fill={isLeftPlayerCurrent ? "#ff5722" : "black"}
            fontStyle={isLeftPlayerCurrent ? "bold" : "normal"}
          />
          <Rect
            x={is_left ? 0 : 625}
            y={item["left_begin_y"] + 2 + y_padding}
            width={["left_name"].length * 110}
            height={1}
            fill="black"
            visible={"left_out" in item}
          />
          <Text
            x={is_left ? 120 : 750}
            y={item["left_begin_y"] - 2 + y_padding}
            text={GetGroupNameWithBracket(item["left_group_name"])}
            fontSize={GetGroupNameFontSize(item["left_group_name"])}
            fill={
              groupNameStates[item["left_group_name"]] === 1 ? "red" : "black"
            }
            visible={groupNameStates[item["left_group_name"]] !== 3}
            onClick={() =>
              onGroupNameClick && onGroupNameClick(item["left_group_name"])
            }
            onTap={() =>
              onGroupNameClick && onGroupNameClick(item["left_group_name"])
            }
          />
          {groupNameStates[item["left_group_name"]] === 2 && (
            <Rect
              x={is_left ? 120 : 750}
              y={item["left_begin_y"] - 7 + y_padding}
              width={item["left_group_name"].length * 10 + 20}
              height={20}
              fill={
                getDistrictColor && getDistrictColor(item["left_group_name"])
              }
              opacity={0.5}
              onClick={() =>
                onGroupNameClick && onGroupNameClick(item["left_group_name"])
              }
              onTap={() =>
                onGroupNameClick && onGroupNameClick(item["left_group_name"])
              }
            />
          )}
          <Rect
            x={is_left ? 120 : 750}
            y={item["left_begin_y"] + 5 + y_padding}
            width={["left_group_name"].length * 80}
            height={1}
            fill="black"
            visible={"left_out" in item && item["left_group_name"] !== "''"}
          />
          <Text
            x={is_left ? 100 : 730}
            y={item["left_begin_y"] - 15 + y_padding}
            text={`前年度同大会${(item["id"] % 4) + 1}位`}
            fontSize={12}
            fill="green"
            fontStyle="bold"
            visible={showIds}
          />
        </Group>
      );
    }
    if (!has_right) {
      const rightGroupKey = `right_only_${item["id"]}`;
      const rightPos = textPositions[rightGroupKey] || { x: 0, y: 0 };

      return (
        <Group
          x={rightPos.x}
          y={rightPos.y}
          draggable={true}
          onDragEnd={(e) => {
            if (onTextDrag) {
              onTextDrag(rightGroupKey, { x: e.target.x(), y: e.target.y() });
            }
          }}
        >
          <Text
            x={is_left ? 0 : 630}
            y={item["right_begin_y"] - 20 + y_padding}
            text={item["right_name_kana"]}
            fontSize={10}
          />
          <Rect
            x={is_left ? 0 : 625}
            y={item["right_begin_y"] - 16 + y_padding}
            width={["right_name_kana"].length * 110}
            height={1}
            fill="black"
            visible={"right_out" in item}
          />
          <Text
            x={is_left ? 0 : 630}
            y={item["right_begin_y"] - 7 + y_padding}
            text={GetSplitName(item["right_name"])}
            fontSize={item["right_name"].length < 8 ? 18 : 14}
            fill={isRightPlayerCurrent ? "#ff5722" : "black"}
            fontStyle={isRightPlayerCurrent ? "bold" : "normal"}
          />
          <Rect
            x={is_left ? 0 : 625}
            y={item["right_begin_y"] + 2 + y_padding}
            width={["right_name"].length * 110}
            height={1}
            fill="black"
            visible={"right_out" in item}
          />
          <Text
            x={is_left ? 120 : 750}
            y={item["right_begin_y"] - 2 + y_padding}
            text={GetGroupNameWithBracket(item["right_group_name"])}
            fontSize={GetGroupNameFontSize(item["right_group_name"])}
            fill={
              groupNameStates[item["right_group_name"]] === 1 ? "red" : "black"
            }
            visible={groupNameStates[item["right_group_name"]] !== 3}
            onClick={() =>
              onGroupNameClick && onGroupNameClick(item["right_group_name"])
            }
            onTap={() =>
              onGroupNameClick && onGroupNameClick(item["right_group_name"])
            }
          />
          {groupNameStates[item["right_group_name"]] === 2 && (
            <Rect
              x={is_left ? 120 : 750}
              y={item["right_begin_y"] - 7 + y_padding}
              width={item["right_group_name"].length * 10 + 20}
              height={20}
              fill={
                getDistrictColor && getDistrictColor(item["right_group_name"])
              }
              opacity={0.5}
              onClick={() =>
                onGroupNameClick && onGroupNameClick(item["right_group_name"])
              }
              onTap={() =>
                onGroupNameClick && onGroupNameClick(item["right_group_name"])
              }
            />
          )}
          <Rect
            x={is_left ? 120 : 750}
            y={item["right_begin_y"] + 5 + y_padding}
            width={["right_group_name"].length * 80}
            height={1}
            fill="black"
            visible={"right_out" in item && item["right_group_name"] !== "''"}
          />
          <Text
            x={is_left ? 100 : 730}
            y={item["right_begin_y"] - 15 + y_padding}
            text={`地区大会${(item["id"] % 4) + 1}位`}
            fontSize={12}
            fill="orange"
            fontStyle="bold"
            visible={showIds}
          />
        </Group>
      );
    }
  } else if ("fake_round" in item) {
    const x = 220 + lineWidth + (item["fake_round"] - 2) * 30;
    const width =
      620 -
      lineWidth -
      (item["fake_round"] - 2) * 30 -
      (220 + lineWidth + (item["fake_round"] - 2) * 30);

    const leftFakeGroupKey = `fake_left_${item["id"]}`;
    const rightFakeGroupKey = `fake_right_${item["id"]}`;
    const leftFakePos = textPositions[leftFakeGroupKey] || { x: 0, y: 0 };
    const rightFakePos = textPositions[rightFakeGroupKey] || { x: 0, y: 0 };

    return (
      <>
        <Group
          x={leftFakePos.x}
          y={leftFakePos.y}
          draggable={true}
          onDragEnd={(e) => {
            if (onTextDrag) {
              onTextDrag(leftFakeGroupKey, {
                x: e.target.x(),
                y: e.target.y(),
              });
            }
          }}
        >
          <Text
            x={x - 220}
            y={item["left_begin_y"] - 10 + y_padding}
            text={hide ? "" : GetSplitName(item["left_name"])}
            fontSize={
              (item["left_name"] !== null && item["left_name"].length) < 8
                ? 18
                : 14
            }
          />
          <Text
            x={x - 220}
            y={item["left_begin_y"] - 30 + y_padding}
            text={hide ? "" : item["left_name_kana"]}
            fontSize={12}
          />
          <Text
            x={x - 110}
            y={item["left_begin_y"] - 5 + y_padding}
            text={
              item["left_group_name"] !== null && !hide
                ? GetGroupNameWithBracket(item["left_group_name"])
                : ""
            }
            fontSize={GetGroupNameFontSize(item["left_group_name"])}
            fill={
              groupNameStates[item["left_group_name"]] === 1 ? "red" : "black"
            }
            visible={groupNameStates[item["left_group_name"]] !== 3}
            onClick={() =>
              onGroupNameClick && onGroupNameClick(item["left_group_name"])
            }
            onTap={() =>
              onGroupNameClick && onGroupNameClick(item["left_group_name"])
            }
          />
          {groupNameStates[item["left_group_name"]] === 2 &&
            item["left_group_name"] !== null &&
            !hide && (
              <Rect
                x={x - 110}
                y={item["left_begin_y"] - 10 + y_padding}
                width={item["left_group_name"].length * 10 + 20}
                height={20}
                fill={
                  getDistrictColor && getDistrictColor(item["left_group_name"])
                }
                opacity={0.5}
                onClick={() =>
                  onGroupNameClick && onGroupNameClick(item["left_group_name"])
                }
                onTap={() =>
                  onGroupNameClick && onGroupNameClick(item["left_group_name"])
                }
              />
            )}
          <Text
            x={x - 120}
            y={item["left_begin_y"] - 18 + y_padding}
            text={`団体内ランク${(item["id"] % 4) + 1}位`}
            fontSize={12}
            fill="purple"
            fontStyle="bold"
            visible={showIds}
          />
        </Group>
        <Group
          x={rightFakePos.x}
          y={rightFakePos.y}
          draggable={true}
          onDragEnd={(e) => {
            if (onTextDrag) {
              onTextDrag(rightFakeGroupKey, {
                x: e.target.x(),
                y: e.target.y(),
              });
            }
          }}
        >
          <Text
            x={x + width + 10}
            y={item["left_begin_y"] - 10 + y_padding}
            text={hide ? "" : GetSplitName(item["right_name"])}
            fontSize={
              (item["right_name"] !== null && item["right_name"].length) < 8
                ? 18
                : 14
            }
          />
          <Text
            x={x + width + 10}
            y={item["left_begin_y"] - 30 + y_padding}
            text={hide ? "" : item["right_name_kana"]}
            fontSize={12}
          />
          <Text
            x={x + width + 130}
            y={item["left_begin_y"] - 5 + y_padding}
            text={
              item["right_group_name"] !== null && !hide
                ? GetGroupNameWithBracket(item["right_group_name"])
                : ""
            }
            fontSize={GetGroupNameFontSize(item["right_group_name"])}
            fill={
              groupNameStates[item["right_group_name"]] === 1 ? "red" : "black"
            }
            visible={groupNameStates[item["right_group_name"]] !== 3}
            onClick={() =>
              onGroupNameClick && onGroupNameClick(item["right_group_name"])
            }
            onTap={() =>
              onGroupNameClick && onGroupNameClick(item["right_group_name"])
            }
          />
          {groupNameStates[item["right_group_name"]] === 2 &&
            item["right_group_name"] !== null &&
            !hide && (
              <Rect
                x={x + width + 130}
                y={item["left_begin_y"] - 10 + y_padding}
                width={item["right_group_name"].length * 10 + 20}
                height={20}
                fill={
                  getDistrictColor && getDistrictColor(item["right_group_name"])
                }
                opacity={0.5}
                onClick={() =>
                  onGroupNameClick && onGroupNameClick(item["right_group_name"])
                }
                onTap={() =>
                  onGroupNameClick && onGroupNameClick(item["right_group_name"])
                }
              />
            )}
          <Text
            x={x + width + 120}
            y={item["left_begin_y"] - 18 + y_padding}
            text={`団体内ランク${(item["id"] % 4) + 1}位`}
            fontSize={12}
            fill="teal"
            fontStyle="bold"
            visible={showIds}
          />
        </Group>
      </>
    );
  }
  return <></>;
}

function CreateBlock(
  item,
  lineWidth,
  maxHeight,
  editable,
  event_name,
  returnUrl,
  hide,
  currentGameIds = [],
  blinkState = true,
  fromAdmin = false,
  selectedMatchId = null,
  onMatchIdClick = null,
) {
  const router = useRouter();

  const onUpdate = (id, editable) => {
    if (editable) {
      router.push(
        "update_result?event_name=" +
          event_name +
          "&id=" +
          id +
          "&return_url=" +
          returnUrl,
      );
    }
  };

  const is_left = item["block_pos"] === "left";
  const is_right = item["block_pos"] === "right";
  const pointX = is_left ? 220 : 620;
  const y_padding = maxHeight < 200 ? 50 : 0;

  let isCurrentGame = false;
  let matchedBlockKey = null;
  if (currentGameIds) {
    for (const [key, value] of Object.entries(currentGameIds)) {
      if (value && item["id"] === value) {
        isCurrentGame = true;
        matchedBlockKey = key;
        break;
      }
    }
  }
  if (!is_left && !is_right) {
    if ("left_begin_y" in item && "right_begin_y" in item) {
      const x = 220 + lineWidth + (item["round"] - 2) * 30;
      const width =
        620 -
        lineWidth -
        (item["round"] - 2) * 30 -
        (220 + lineWidth + (item["round"] - 2) * 30);
      let left_flag;
      if (!hide) {
        left_flag = event_name.includes("dantai")
          ? item["left_group_flag"]
          : item["left_player_flag"];
      }
      let left_winner;
      let right_winner;
      if (event_name.includes("hokei")) {
        left_winner = left_flag !== null && left_flag >= 2;
        right_winner = left_flag !== null && left_flag < 2;
      } else if (event_name.includes("zissen")) {
        left_winner = left_flag !== null && left_flag >= 1;
        right_winner = left_flag !== null && left_flag < 1;
      }
      return (
        <>
          <Rect
            x={x}
            y={item["left_begin_y"] + y_padding}
            width={width / 2}
            height={left_winner ? 5 : 1}
            fill={left_winner ? "red" : "black"}
            strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
          />
          <Rect
            x={x + width / 2}
            y={item["left_begin_y"] + y_padding}
            width={width / 2}
            height={right_winner ? 5 : 1}
            fill={right_winner ? "red" : "black"}
            strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
          />
          <Rect
            x={x + width / 2}
            y={item["left_begin_y"] + y_padding}
            width={left_winner || right_winner ? 5 : 1}
            height={-50 + (maxHeight ? 20 : 0)}
            fill={left_winner || right_winner ? "red" : "black"}
            strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
          />
          <Text
            x={x + width / 2 - 20}
            y={item["left_begin_y"] - 70 + (maxHeight ? 20 : 0) + y_padding}
            text={"決勝"}
            fontSize={18}
          />
          <Rect
            x={x + width / 2 - 16}
            y={item["left_begin_y"] - 5 + y_padding}
            width={30}
            height={30}
            strokeWidth={isCurrentGame ? 4 : 0}
            stroke={
              isCurrentGame
                ? blinkState
                  ? "#ff9800"
                  : "transparent"
                : "transparent"
            }
            fill={
              isCurrentGame
                ? blinkState
                  ? "#ffe0b2"
                  : "transparent"
                : "transparent"
            }
            cornerRadius={5}
            onClick={(e) => onUpdate(item["id"], editable)}
            onTap={(e) => onUpdate(item["id"], editable)}
          />
          <Text
            x={x + width / 2 - 8}
            y={item["left_begin_y"] + 5 + y_padding}
            text={item["id"]}
            fill={selectedMatchId === item["id"] ? "red" : "gray"}
            fontSize={12}
            listening={true}
            onClick={(e) => {
              if (onMatchIdClick) {
                onMatchIdClick(item["id"], editable);
              } else {
                onUpdate(item["id"], editable);
              }
            }}
            onTap={(e) => {
              if (onMatchIdClick) {
                onMatchIdClick(item["id"], editable);
              } else {
                onUpdate(item["id"], editable);
              }
            }}
          />
          <Text
            x={x + width / 2 - 8}
            y={item["left_begin_y"] + 27 + y_padding}
            text={
              isCurrentGame && matchedBlockKey
                ? matchedBlockKey.toUpperCase()
                : ""
            }
            fontSize={20}
            fill={
              isCurrentGame
                ? blinkState
                  ? "#ff5722"
                  : "transparent"
                : "#ff5722"
            }
            fontStyle={"bold"}
            visible={isCurrentGame}
          />
          <Text
            x={x + width / 2 - 10}
            y={item["left_begin_y"] - 15 + y_padding}
            text={
              event_name.includes("hokei") &&
              left_flag !== null &&
              left_flag >= 0 &&
              left_flag <= 3
                ? left_flag
                : ""
            }
            fill={"blue"}
            fontSize={15}
          />
          <Text
            x={x + width / 2 + 8}
            y={item["left_begin_y"] - 15 + y_padding}
            text={
              event_name.includes("hokei") &&
              left_flag !== null &&
              left_flag >= 0 &&
              left_flag <= 3
                ? 3 - left_flag
                : ""
            }
            fill={"blue"}
            fontSize={15}
          />
        </>
      );
    } else {
      const x = 220 + lineWidth + (item["fake_round"] - 2) * 30;
      const width =
        620 -
        lineWidth -
        (item["fake_round"] - 2) * 30 -
        (220 + lineWidth + (item["fake_round"] - 2) * 30);
      let left_flag;
      if (!hide) {
        left_flag = event_name.includes("dantai")
          ? item["left_group_flag"]
          : item["left_player_flag"];
      }
      let left_winner;
      let right_winner;
      if (event_name.includes("hokei")) {
        left_winner = left_flag !== null && left_flag >= 2;
        right_winner = left_flag !== null && left_flag < 2;
      } else if (event_name.includes("zissen")) {
        left_winner = left_flag !== null && left_flag >= 1;
        right_winner = left_flag !== null && left_flag < 1;
      }
      return (
        <>
          <Rect
            x={x}
            y={item["left_begin_y"] + y_padding}
            width={width / 2}
            height={left_winner ? 5 : 1}
            fill={left_winner ? "red" : "black"}
            strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
          />
          <Rect
            x={x + width / 2}
            y={item["left_begin_y"] + y_padding}
            width={width / 2}
            height={right_winner ? 5 : 1}
            fill={right_winner ? "red" : "black"}
            strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
          />
          <Rect
            x={x + width / 2}
            y={item["left_begin_y"] + y_padding}
            width={left_winner || right_winner ? 5 : 1}
            height={-50}
            fill={
              left_winner || right_winner
                ? "red"
                : isCurrentGame
                  ? "black"
                  : "black"
            }
            strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
          />
          <Text
            x={x + width / 2 - 20}
            y={item["left_begin_y"] - 70 + y_padding}
            text={"三決"}
            fontSize={18}
          />
          <Text
            x={x + width / 2 - 8}
            y={item["left_begin_y"] + 27 + y_padding}
            text={
              isCurrentGame && matchedBlockKey
                ? matchedBlockKey.toUpperCase()
                : ""
            }
            fontSize={20}
            fill={
              isCurrentGame
                ? blinkState
                  ? "#ff5722"
                  : "transparent"
                : "#ff5722"
            }
            fontStyle={"bold"}
            visible={isCurrentGame}
          />
          <Rect
            x={x + width / 2 - 16}
            y={item["left_begin_y"] - 5 + y_padding}
            width={30}
            height={30}
            strokeWidth={isCurrentGame ? (blinkState ? 4 : 0) : 0}
            stroke={
              isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
            }
            fill={
              isCurrentGame
                ? blinkState
                  ? "#ffe0b2"
                  : "transparent"
                : "transparent"
            }
            cornerRadius={5}
            onClick={(e) => onUpdate(item["id"], editable)}
            onTap={(e) => onUpdate(item["id"], editable)}
          />
          <Text
            x={x + width / 2 - 8}
            y={item["left_begin_y"] + 5 + y_padding}
            text={item["id"]}
            fill={selectedMatchId === item["id"] ? "red" : "gray"}
            fontSize={12}
            listening={true}
            onClick={(e) => {
              if (onMatchIdClick) {
                onMatchIdClick(item["id"], editable);
              } else {
                onUpdate(item["id"], editable);
              }
            }}
            onTap={(e) => {
              if (onMatchIdClick) {
                onMatchIdClick(item["id"], editable);
              } else {
                onUpdate(item["id"], editable);
              }
            }}
          />
          <Text
            x={x + width / 2 - 10}
            y={item["left_begin_y"] - 15 + y_padding}
            text={
              event_name.includes("hokei") &&
              left_flag !== null &&
              left_flag >= 0 &&
              left_flag <= 3
                ? left_flag
                : ""
            }
            fill={"blue"}
            fontSize={15}
          />
          <Text
            x={x + width / 2 + 8}
            y={item["left_begin_y"] - 15 + y_padding}
            text={
              event_name.includes("hokei") &&
              left_flag !== null &&
              left_flag >= 0 &&
              left_flag <= 3
                ? 3 - left_flag
                : ""
            }
            fill={"blue"}
            fontSize={15}
          />
        </>
      );
    }
  }
  if ("left_begin_y" in item && "right_begin_y" in item) {
    const has_left = "has_left" in item;
    const has_right = "has_right" in item;
    let left_flag;
    if (!hide) {
      left_flag = event_name.includes("dantai")
        ? item["left_group_flag"]
        : item["left_player_flag"];
    }
    let left_winner;
    let right_winner;
    if (left_flag === -2) {
      left_winner = false;
      right_winner = false;
    } else if (event_name.includes("hokei")) {
      left_winner = left_flag !== null && left_flag >= 2;
      right_winner = left_flag !== null && left_flag < 2;
    } else if (event_name.includes("zissen")) {
      left_winner = left_flag !== null && left_flag >= 1;
      right_winner = left_flag !== null && left_flag < 1;
    }
    let upper_focus = false;
    let lower_focus = false;
    if (left_winner) {
      if (is_left) {
        upper_focus = true;
      } else {
        lower_focus = true;
      }
    }
    if (right_winner) {
      if (is_left) {
        lower_focus = true;
      } else {
        upper_focus = true;
      }
    }
    if (left_flag !== null) {
      if (left_flag === -2) {
        item["left_out"] = true;
        item["right_out"] = true;
      } else if (left_flag === -1) {
        item["left_out"] = true;
      } else if (event_name.includes("hokei") && left_flag === 4) {
        item["right_out"] = true;
      } else if (event_name.includes("zissen") && left_flag === 2) {
        item["right_out"] = true;
      }
    } else {
      if (fromAdmin && item["left_retire"] === 1) {
        item["left_out"] = true;
      }
      if (fromAdmin && item["right_retire"] === 1) {
        item["right_out"] = true;
      }
    }
    return (
      <>
        <Rect
          x={
            pointX +
            (has_left ? lineWidth + (item["round"] - 2) * 30 : 0) *
              (is_left ? 1 : -1)
          }
          y={item["left_begin_y"] + y_padding}
          fill={
            left_winner ||
            (has_left && right_winner && item["left_name"] !== null)
              ? "red"
              : "black"
          }
          width={
            (has_left ? 30 : lineWidth + (item["round"] - 1) * 30) *
            (is_left ? 1 : -1)
          }
          height={
            left_winner ||
            (has_left && right_winner && item["left_name"] !== null)
              ? 5
              : 1
          }
          strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
          stroke={
            isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
          }
        />
        <Rect
          x={
            pointX +
            (has_right ? lineWidth + (item["round"] - 2) * 30 : 0) *
              (is_left ? 1 : -1)
          }
          y={item["right_begin_y"] + y_padding}
          fill={
            right_winner ||
            (has_right && left_winner && item["right_name"] !== null)
              ? "red"
              : "black"
          }
          width={
            (has_right ? 30 : lineWidth + (item["round"] - 1) * 30) *
            (is_left ? 1 : -1)
          }
          height={
            right_winner ||
            (has_right && left_winner && item["right_name"] !== null)
              ? 5
              : 1
          }
          strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
          stroke={
            isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
          }
        />
        <Text
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30 - 10
              : pointX - lineWidth - (item["round"] - 1) * 30
          }
          y={
            (is_left ? item["left_begin_y"] - 15 : item["left_begin_y"] + 4) +
            y_padding
          }
          text={
            event_name.includes("hokei") &&
            left_flag !== null &&
            left_flag >= 0 &&
            left_flag <= 3
              ? left_flag
              : ""
          }
          fill={"blue"}
          fontSize={15}
        />
        <Text
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30 - 10
              : pointX - lineWidth - (item["round"] - 1) * 30
          }
          y={
            (is_left ? item["right_begin_y"] + 4 : item["right_begin_y"] - 15) +
            y_padding
          }
          text={
            event_name.includes("hokei") &&
            left_flag !== null &&
            left_flag >= 0 &&
            left_flag <= 3
              ? 3 - left_flag
              : ""
          }
          fill={"blue"}
          fontSize={15}
        />
        <Rect
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30
              : pointX - lineWidth - (item["round"] - 1) * 30
          }
          y={
            (is_left ? item["left_begin_y"] : item["right_begin_y"]) + y_padding
          }
          fill={upper_focus ? "red" : "black"}
          width={upper_focus ? 5 : 1}
          height={
            (item["left_begin_y"] - item["right_begin_y"]) *
              0.5 *
              (is_left ? -1 : 1) +
            ("offset_y" in item ? item["offset_y"] : 0)
          }
          strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
          stroke={
            isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
          }
        />
        <Rect
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30
              : pointX - lineWidth - (item["round"] - 1) * 30
          }
          y={
            (item["left_begin_y"] + item["right_begin_y"]) * 0.5 +
            ("offset_y" in item ? item["offset_y"] : 0) +
            y_padding
          }
          fill={lower_focus ? "red" : "black"}
          width={lower_focus ? 5 : 1}
          height={
            (item["left_begin_y"] - item["right_begin_y"]) *
              0.5 *
              (is_left ? -1 : 1) +
            (lower_focus ? 4 : 0) -
            ("offset_y" in item ? item["offset_y"] : 0)
          }
          strokeWidth={isCurrentGame ? (blinkState ? 2 : 0) : 0}
          stroke={
            isCurrentGame ? (blinkState ? "#ff9800" : "transparent") : "black"
          }
        />
        <Rect
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30 - 22
              : pointX - lineWidth - (item["round"] - 1) * 30 - 3
          }
          y={
            (item["left_begin_y"] + item["right_begin_y"]) * 0.5 -
            5 +
            ("offset_y" in item ? item["offset_y"] : 0) -
            10 +
            y_padding
          }
          width={30}
          height={30}
          strokeWidth={isCurrentGame ? (blinkState ? 4 : 0) : 0}
          stroke={
            isCurrentGame
              ? blinkState
                ? "#ff9800"
                : "transparent"
              : "transparent"
          }
          fill={
            isCurrentGame
              ? blinkState
                ? "#ffe0b2"
                : "transparent"
              : "transparent"
          }
          cornerRadius={5}
          onClick={(e) => onUpdate(item["id"], editable)}
          onTap={(e) => onUpdate(item["id"], editable)}
        />
        <Text
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30 - 15
              : pointX - lineWidth - (item["round"] - 1) * 30 + 5
          }
          y={
            (item["left_begin_y"] + item["right_begin_y"]) * 0.5 -
            5 +
            ("offset_y" in item ? item["offset_y"] : 0) +
            y_padding
          }
          text={item["id"] < 10 ? " " + item["id"] : item["id"]}
          fill={selectedMatchId === item["id"] ? "red" : "gray"}
          fontSize={12}
          listening={true}
          onClick={(e) => {
            if (onMatchIdClick) {
              onMatchIdClick(item["id"], editable);
            } else {
              onUpdate(item["id"], editable);
            }
          }}
          onTap={(e) => {
            if (onMatchIdClick) {
              onMatchIdClick(item["id"], editable);
            } else {
              onUpdate(item["id"], editable);
            }
          }}
        />
        <Text
          x={
            is_left
              ? pointX + lineWidth + (item["round"] - 1) * 30 + 10
              : pointX - lineWidth - (item["round"] - 1) * 30 - 20
          }
          y={
            (item["left_begin_y"] + item["right_begin_y"]) * 0.5 -
            25 +
            ("offset_y" in item ? item["offset_y"] : 0) +
            y_padding
          }
          text={
            isCurrentGame && matchedBlockKey
              ? matchedBlockKey.toUpperCase()
              : ""
          }
          fontSize={20}
          fill={
            isCurrentGame ? (blinkState ? "#ff5722" : "transparent") : "#ff5722"
          }
          fontStyle={"bold"}
          visible={isCurrentGame}
        />
      </>
    );
  }
  return <></>;
}

function EditResult({
  backUrl = null,
  editable = false,
  updateInterval = 10000,
  returnUrl = null,
  event_name = null,
  block_number = null,
  hide = false,
  show_highlight = true,
  is_mobile = false,
  fromAdmin = false,
}) {
  const router = useRouter();
  if (returnUrl === null) {
    returnUrl = event_name + "_result";
  }
  const onBack = () => {
    if (backUrl === null) {
      router.back();
    } else {
      router.push(backUrl);
    }
  };

  const [data, setData] = useState([]);
  const [eventInfo, setEventInfo] = useState({
    full_name: "",
    description: [],
  });
  const [lineWidth, setLineWidth] = useState(50);
  const [currentBlockData, setCurrentBlockData] = useState({});
  const [courts, setCourts] = useState([]);
  const [blinkState, setBlinkState] = useState(true);
  const [textPositions, setTextPositions] = useState({});
  const [showIds, setShowIds] = useState(true);
  const [groupNameStates, setGroupNameStates] = useState({});
  const [districtColors, setDistrictColors] = useState({});
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const fetchCurrentBlock = useCallback(async () => {
    const blockData = {};
    for (const court of courts) {
      const blockNumber = court.name.replace(/['"コート]/g, "").toLowerCase();
      const response = await fetch(
        `/api/current_block?block_number=${blockNumber}&event_name=${event_name}`,
      );
      const result = await response.json();
      if (result) {
        blockData[blockNumber] = result;
      }
    }
    setCurrentBlockData({ ...blockData });
  }, [courts, event_name]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/get_result?event_name=" + event_name);
      const result = await response.json();
      setData(result);
      if (result.length > 0) {
        const roundNum = Math.max(
          ...result.map((d) => Number(d.round)).filter((n) => !isNaN(n)),
        );
        setLineWidth(roundNum > 6 ? 25 : 50);
      }
    }
    fetchData();
    async function fetchEventDescription() {
      const response = await fetch(
        "/api/get_event_info?event_name=" +
          (event_name.includes("test")
            ? event_name.replace("test_", "")
            : event_name),
      );
      const result = await response.json();
      if (
        result.length > 0 &&
        result[0]["full_name"] &&
        result[0]["description"]
      ) {
        // use "|" as a separator
        setEventInfo({
          full_name: result[0]["full_name"].replace(/['"]+/g, ""),
          description: result[0]["description"]
            .replace(/['"]+/g, "")
            .split("|"),
        });
      }
    }
    fetchEventDescription();
    async function fetchCourts() {
      const response = await fetch("/api/get_courts");
      const result = await response.json();
      setCourts(result);
    }
    if (!hide && show_highlight) {
      fetchCourts();
      fetchCurrentBlock();
    }
    if (updateInterval > 0) {
      const interval = setInterval(() => {
        fetchData();
        if (courts.length > 0) {
          fetchCurrentBlock();
        }
      }, updateInterval);
      return () => {
        clearInterval(interval);
      };
    }
  }, [event_name, updateInterval, block_number, courts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (courts.length > 0) {
      fetchCurrentBlock();
    }
  }, [courts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (Object.keys(currentBlockData).length > 0) {
      const blinkInterval = setInterval(() => {
        setBlinkState((prev) => !prev);
      }, 500);
      return () => clearInterval(blinkInterval);
    }
  }, [currentBlockData]);

  const sortedData = data.sort((a, b) => a.id - b.id);
  let maxHeight = 0;
  for (let i = 0; i < data.length; i++) {
    if ("left_begin_y" in data[i] && maxHeight < data[i]["left_begin_y"]) {
      maxHeight = data[i]["left_begin_y"];
    }
    if ("right_begin_y" in data[i] && maxHeight < data[i]["right_begin_y"]) {
      maxHeight = data[i]["right_begin_y"];
    }
  }

  // calc num of players
  let num_of_players = 0;
  for (let i = 0; i < sortedData.length; i++) {
    const item = sortedData[i];
    if (item["block_pos"] === "left" || item["block_pos"] === "right") {
      if (!("has_left" in item)) {
        num_of_players++;
      }
      if (!("has_right" in item)) {
        num_of_players++;
      }
    }
  }
  const y_padding = maxHeight < 200 ? 50 : 0;
  const areaWidth = is_mobile ? "340px" : "850px";
  const areaWidthNum = is_mobile ? 340 : 850;
  const stageScale = is_mobile ? 0.8 : 1;
  const [stagePosX, setStagePosX] = useState(0);
  const [stagePosY, setStagePosY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchPosX, setLastTouchPosX] = useState(0);
  const [lastTouchPosY, setLastTouchPosY] = useState(0);
  useEffect(() => {
    if (is_mobile) {
      const savedPosX = localStorage.getItem(event_name + "stagePosX");
      if (savedPosX) {
        setStagePosX(savedPosX);
      }
      const savedPosY = localStorage.getItem(event_name + "stagePosY");
      if (savedPosY) {
        setStagePosY(savedPosY);
      }
    }
  }, [is_mobile, event_name]);
  const handleTouchStart = (event) => {
    event.evt.preventDefault();
    const point = event.target.getStage().getPointerPosition();
    setLastTouchPosX(point.x);
    setLastTouchPosY(point.y);
    setIsDragging(true);
  };

  const handleTouchMove = (event) => {
    if (!isDragging || !lastTouchPosX || !lastTouchPosY) return;

    event.evt.preventDefault();
    const point = event.target.getStage().getPointerPosition();
    const deltaX = point.x - lastTouchPosX;
    const deltaY = point.y - lastTouchPosY;
    const nextStagePosX = parseFloat(stagePosX + deltaX);
    const nextStagePosY = parseFloat(stagePosY + deltaY);
    if (nextStagePosX > 0) {
      setStagePosX(0);
    } else if (nextStagePosX < -400) {
      setStagePosX(-400);
    } else {
      setStagePosX(nextStagePosX);
    }
    if (nextStagePosY > 0) {
      setStagePosY(0);
    } else if (nextStagePosY < -maxHeight * 0.8) {
      setStagePosY(-maxHeight * 0.8);
    } else {
      setStagePosY(nextStagePosY);
    }
    localStorage.setItem(event_name + "stagePosX", stagePosX);
    localStorage.setItem(event_name + "stagePosY", stagePosY);
    setLastTouchPosX(point.x);
    setLastTouchPosY(point.y);
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchPosX(null);
    setLastTouchPosY(null);
  };

  const handleTextDrag = (groupKey, position) => {
    setTextPositions((prev) => ({
      ...prev,
      [groupKey]: position,
    }));
  };

  const resetTextPositions = () => {
    setTextPositions({});
  };

  const toggleIds = () => {
    setShowIds((prev) => !prev);
  };

  const getDistrictColor = (districtName) => {
    if (!districtColors[districtName]) {
      const colors = [
        "#ffeb3b",
        "#ff9800",
        "#ff5722",
        "#e91e63",
        "#9c27b0",
        "#673ab7",
        "#3f51b5",
        "#2196f3",
        "#03a9f4",
        "#00bcd4",
        "#009688",
        "#4caf50",
        "#8bc34a",
        "#cddc39",
        "#ffc107",
        "#ff6f00",
      ];
      const usedColors = Object.values(districtColors);
      const availableColors = colors.filter(
        (color) => !usedColors.includes(color),
      );
      const selectedColor =
        availableColors.length > 0
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : colors[Math.floor(Math.random() * colors.length)];

      setDistrictColors((prev) => ({ ...prev, [districtName]: selectedColor }));
      return selectedColor;
    }
    return districtColors[districtName];
  };

  const handleGroupNameClick = (groupName) => {
    setGroupNameStates((prev) => {
      const currentState = prev[groupName] || 0;
      const nextState = (currentState + 1) % 3;
      return {
        ...prev,
        [groupName]: nextState === 0 ? undefined : nextState,
      };
    });
  };

  const handleMatchIdClick = (matchId, editable) => {
    if (selectedMatchId === null) {
      setSelectedMatchId(matchId);
    } else if (selectedMatchId === matchId) {
      setSelectedMatchId(null);
    } else {
      const firstMatchData = data.find((item) => item.id === selectedMatchId);
      const secondMatchData = data.find((item) => item.id === matchId);

      if (firstMatchData && secondMatchData) {
        setData((prevData) =>
          prevData.map((item) => {
            if (item.id === selectedMatchId) {
              return { ...item, id: matchId };
            } else if (item.id === matchId) {
              return { ...item, id: selectedMatchId };
            }
            return item;
          }),
        );
      }

      setSelectedMatchId(null);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "a" || event.key === "A") {
        toggleIds();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: areaWidth }}>
          {is_mobile ? (
            <></>
          ) : (
            <>
              <Grid
                container
                justifyContent="center"
                alignItems="center"
                style={{ height: "70px" }}
              >
                <h1>
                  <u>
                    {eventInfo.full_name +
                      (num_of_players > 0
                        ? "　" +
                          num_of_players +
                          (event_name.includes("dantai") ? "チーム" : "人")
                        : "")}
                  </u>
                </h1>
              </Grid>
              {eventInfo.description.map((text, index) => (
                <Grid
                  key={index}
                  container
                  justifyContent="center"
                  alignItems="center"
                  style={{ height: "20px" }}
                >
                  {text}
                </Grid>
              ))}
            </>
          )}
          <br />
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: maxHeight + 50 + y_padding }}
          >
            <Box
              sx={{
                width: areaWidth,
                height: maxHeight + 50 + y_padding,
                overflow: "hidden",
                margin: "0 auto",
                position: "relative",
              }}
            >
              <Stage
                width={areaWidthNum}
                height={is_mobile ? 600 : maxHeight + 50 + y_padding}
                x={stagePosX}
                y={stagePosY}
                scaleX={stageScale}
                scaleY={stageScale}
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
                onTouchStart={is_mobile ? handleTouchStart : null}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Layer>
                  {sortedData.map((item, index) =>
                    CreateBlock(
                      item,
                      lineWidth,
                      maxHeight,
                      editable,
                      event_name,
                      returnUrl,
                      hide,
                      Object.fromEntries(
                        Object.entries(currentBlockData).map(([key, value]) => [
                          key,
                          value?.id,
                        ]),
                      ),
                      blinkState,
                      fromAdmin,
                      selectedMatchId,
                      handleMatchIdClick,
                    ),
                  )}
                  {sortedData.map((item, index) =>
                    event_name.includes("dantai")
                      ? CreateDantaiText(item, lineWidth, y_padding, hide)
                      : CreateText(
                          item,
                          lineWidth,
                          y_padding,
                          hide,
                          Object.values(currentBlockData),
                          blinkState,
                          textPositions,
                          handleTextDrag,
                          showIds,
                          groupNameStates,
                          handleGroupNameClick,
                          getDistrictColor,
                        ),
                  )}
                </Layer>
              </Stage>
            </Box>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default EditResult;
