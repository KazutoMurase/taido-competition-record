import { useEffect, useState } from 'react';
import React from "react";
React.useLayoutEffect = React.useEffect;
import { useRouter } from 'next/router';
import axios from 'axios';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { Layer, Stage, Rect, Text } from "react-konva";
import Grid from '@mui/material/Grid';

function createText(item, lineWidth) {
    const is_left = (item['block_pos'] === 'left');
    const is_right = (item['block_pos'] === 'right');
    const has_left = ('has_left' in item);
    const has_right = ('has_right' in item);
    if (is_left || is_right) {
        if (!has_left && !has_right) {
            return (<>
                    <Text
                    x={is_left ? 10 : 630}
                    y={item['left_begin_y']-20}
                    text={item['left_name_kana']}
                    fontSize={10}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['left_begin_y']-16}
                    width={['left_name_kana'].length*120}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                    x={is_left ? 10 : 630}
                    y={item['left_begin_y']-5}
                    text={item['left_name']}
                    fontFamily="Noto Sans JP, sans-serif"
                    fontSize={item['left_name'].length < 8 ? 18 : 14}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['left_begin_y']+2}
                    width={['left_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                    x={is_left ? 130 : 750}
                    y={item['left_begin_y']}
                    text={item['left_group_name'].replace('\'', '【').replace('\'', '】')}
                    fontSize={14}
                    />
                    <Rect
                    x={is_left ? 130 : 750}
                    y={item['left_begin_y']+5}
                    width={['left_group_name'].length*80}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                    x={is_left ? 10 : 630}
                    y={item['right_begin_y']-20}
                    text={item['right_name_kana']}
                    fontSize={10}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['right_begin_y']-18}
                    width={['right_name_kana'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                    x={is_left ? 10 : 630}
                    y={item['right_begin_y']-5}
                    text={item['right_name']}
                    fontSize={item['right_name'].length < 8 ? 18 : 14}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['right_begin_y']}
                    width={['right_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                    x={is_left ? 130 : 750}
                    y={item['right_begin_y']}
                    text={item['right_group_name'].replace('\'', '【').replace('\'', '】')}
                    fontSize={14}
                    />
                    <Rect
                    x={is_left ? 130 : 750}
                    y={item['right_begin_y']+5}
                    width={['right_group_name'].length*80}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    </>
                   );
        }
        if (!has_left) {
            return (
                    <>
                    <Text
                x={is_left ? 10 : 630}
                y={item['left_begin_y']-20}
                text={item['left_name_kana']}
                fontSize={10}
                    />
                    <Rect
                x={is_left ? 0 : 620}
                y={item['left_begin_y']-16}
                width={['left_name_kana'].length*120}
                height={1}
                fill='black'
                visible={'left_out' in item}
                    />
                    <Text
                x={is_left ? 10 : 630}
                y={item['left_begin_y']-5}
                text={item['left_name']}
                fontSize={item['left_name'].length < 8 ? 18 : 14}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['left_begin_y']+2}
                    width={['left_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                x={is_left ? 130 : 750}
                y={item['left_begin_y']}
                text={item['left_group_name'].replace('\'', '【').replace('\'', '】')}
                fontSize={14}
                    />
                    <Rect
                    x={is_left ? 130 : 750}
                    y={item['left_begin_y']+5}
                    width={['left_group_name'].length*80}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    </>
            );
        }
        if (!has_right) {
            return (
                    <>
                    <Text
                x={is_left ? 10 : 630}
                y={item['right_begin_y']-20}
                text={item['right_name_kana']}
                fontSize={10}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['right_begin_y']-16}
                    width={['right_name_kana'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                x={is_left ? 10 : 630}
                y={item['right_begin_y']-5}
                text={item['right_name']}
                fontSize={item['right_name'].length < 8 ? 18 : 14}
                    />
                    <Rect
                    x={is_left ? 0 : 620}
                    y={item['right_begin_y']+2}
                    width={['right_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                x={is_left ? 130 : 750}
                y={item['right_begin_y']}
                text={item['right_group_name'].replace('\'', '【').replace('\'', '】')}
                fontSize={14}
                    />
                    <Rect
                    x={is_left ? 130 : 750}
                    y={item['right_begin_y']+5}
                    width={['right_group_name'].length*80}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    </>
            );
        }
    } else if ('fake_round' in item) {
        const x = 220 + lineWidth + (item['fake_round']-2)*30;
        const width = ((620 - lineWidth - (item['fake_round']-2)*30) -
                       (220 + lineWidth + (item['fake_round']-2)*30));
        return (<>
                <Text
                x={x - 200}
                y={item['left_begin_y']-10}
                text={item['left_name']}
                fontSize={(item['left_name'] !== null && item['left_name'].length) < 8 ? 18 : 14}
                />
                <Text
                x={x - 200}
                y={item['left_begin_y']-30}
                text={item['left_name_kana']}
                fontSize={12}
                    />
                <Text
                x={x - 90}
                y={item['left_begin_y']-5}
                text={item['left_group_name'] !== null ? item['left_group_name'].replace('\'', '【').replace('\'', '】') : ''}
                fontSize={14}
                    />
                <Text
                x={x + width + 10}
                y={item['left_begin_y']-10}
                text={item['right_name']}
                fontSize={(item['right_name'] !== null && item['right_name'].length) < 8 ? 18 : 14}
                    />
                <Text
                x={x + width + 10}
                y={item['left_begin_y']-30}
                text={item['right_name_kana']}
                fontSize={12}
                    />
                <Text
                x={x + width + 130}
                y={item['left_begin_y']-5}
                text={item['right_group_name'] !== null ? item['right_group_name'].replace('\'', '【').replace('\'', '】') : ''}
                fontSize={14}
                    />
                </>
               );
    }
    return (<>
            </>
           );
}

function createBlock(item, lineWidth, editable, event_name, returnUrl) {
    const router = useRouter();

    const onUpdate = (id, editable) => {
        if (editable) {
            router.push('/admin/update_result?event_name=' + event_name + '&id=' + id + '&return_url=' + returnUrl);
        }
    }

    const is_left = (item['block_pos'] === 'left');
    const is_right = (item['block_pos'] === 'right');
    const pointX = (is_left ? 220 : 620);
    if (!is_left && !is_right) {
        if ('left_begin_y' in item &&
            'right_begin_y' in item) {
            const x = 220 + lineWidth + (item['round']-2)*30;
            const width = ((620 - lineWidth - (item['round']-2)*30) -
                           (220 + lineWidth + (item['round']-2)*30));
            const left_player_flag = item['left_player_flag'];
            let left_winner;
            let right_winner;
            if (event_name.includes('hokei')) {
                left_winner = (left_player_flag !== null && left_player_flag >= 2);
                right_winner = (left_player_flag !== null && left_player_flag < 2);
            } else if (event_name.includes('zissen')) {
                left_winner = (left_player_flag !== null && left_player_flag >= 1);
                right_winner = (left_player_flag !== null && left_player_flag < 1);
            }
            return (<>
                    <Rect
                    x={x}
                    y={item['left_begin_y']}
                    width={width / 2}
                    height={left_winner ? 5 : 1}
                    fill={left_winner ? 'red' : 'black'}
                    />
                    <Rect
                    x={x + width / 2}
                    y={item['left_begin_y']}
                    width={width / 2}
                    height={right_winner ? 5 : 1}
                    fill={right_winner ? 'red' : 'black'}
                    />
                    <Rect
                    x={x + width / 2}
                    y={item['left_begin_y']}
                    width={(left_winner || right_winner) ? 5 : 1}
                    height={-50}
                    fill={(left_winner || right_winner) ? 'red' : 'black'}
                    />
                    <Text
                    x={x + width / 2 - 20}
                    y={item['left_begin_y'] - 70}
                    text={'決勝'}
                    fontSize={18}
                    />
                    <Text
                    x={x + width / 2 - 8}
                    y={item['left_begin_y'] + 5}
                    text={item['id']}
                    fill={'gray'}
                    fontSize={12}
                    onClick={e => onUpdate(item['id'], editable)}
                    onTap={e => onUpdate(item['id'], editable)}
                    />
                    <Rect
                    x={x + width / 2 - 16}
                    y={item['left_begin_y'] - 5}
                    width={30}
                    height={30}
                    strokeWidth={2}
                    cornerRadius={5}
                    onClick={e => onUpdate(item['id'], editable)}
                    onTap={e => onUpdate(item['id'], editable)}
                    />
                    <Text
                    x={x + width / 2 - 10}
                    y={item['left_begin_y'] - 15}
                    text={((event_name.includes('hokei') && left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? left_player_flag : "")}
                    fill={'blue'}
                    fontSize={15} />
                    <Text
                    x={x + width / 2 + 8}
                    y={item['left_begin_y'] - 15}
                    text={((event_name.includes('hokei') && left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? (3 - left_player_flag) : "")}
                    fill={'blue'}
                    fontSize={15} />
                    </>);
        } else {
            const x = 220 + lineWidth + (item['fake_round']-2)*30;
            const width = ((620 - lineWidth - (item['fake_round']-2)*30) -
                           (220 + lineWidth + (item['fake_round']-2)*30));
            const left_player_flag = item['left_player_flag'];
            let left_winner;
            let right_winner;
            if (event_name.includes('hokei')) {
                left_winner = (left_player_flag !== null && left_player_flag >= 2);
                right_winner = (left_player_flag !== null && left_player_flag < 2);
            } else if (event_name.includes('zissen')) {
                left_winner = (left_player_flag !== null && left_player_flag >= 1);
                right_winner = (left_player_flag !== null && left_player_flag < 1);
            }
        return (
                <>
                <Rect
            x={x}
            y={item['left_begin_y']}
            width={width / 2}
            height={left_winner ? 5 : 1}
            fill={left_winner ? 'red' : 'black'}
                />
                <Rect
            x={x + width / 2}
            y={item['left_begin_y']}
            width={width / 2}
            height={right_winner ? 5 : 1}
            fill={right_winner ? 'red' : 'black'}
                />
                <Rect
            x={x + width / 2}
            y={item['left_begin_y']}
            width={(left_winner || right_winner) ? 5 : 1}
            height={-50}
            fill={(left_winner || right_winner) ? 'red' : 'black'}
                />
                <Text
            x={x + width / 2 - 20}
            y={item['left_begin_y'] - 70}
            text={'三決'}
            fontSize={18}
                />
                <Rect
            x={x + width / 2 - 16}
            y={item['left_begin_y'] - 5}
            width={30}
            height={30}
            strokeWidth={2}
            cornerRadius={5}
            onClick={e => onUpdate(item['id'], editable)}
            onTap={e => onUpdate(item['id'], editable)}
                />
                <Text
            x={x + width / 2 - 8}
            y={item['left_begin_y'] + 5}
            text={item['id']}
            fill={'gray'}
            fontSize={12}
            onClick={e => onUpdate(item['id'], editable)}
            onTap={e => onUpdate(item['id'], editable)}
                />
                <Text
            x={x + width / 2 - 10}
            y={item['left_begin_y'] - 15}
            text={((event_name.includes('hokei') && left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? left_player_flag : "")}
            fill={'blue'}
            fontSize={15} />
                <Text
            x={x + width / 2 + 8}
            y={item['left_begin_y'] - 15}
            text={((event_name.includes('hokei') && left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? (3 - left_player_flag) : "")}
            fill={'blue'}
            fontSize={15} />
                </>
        );
        }
    }
    if ('left_begin_y' in item &&
        'right_begin_y' in item) {
        const has_left = ('has_left' in item);
        const has_right = ('has_right' in item);
        const left_player_flag = item['left_player_flag'];
        let left_winner;
        let right_winner;
        if (event_name.includes('hokei')) {
            left_winner = (left_player_flag !== null && left_player_flag >= 2);
            right_winner = (left_player_flag !== null && left_player_flag < 2);
        } else if (event_name.includes('zissen')) {
            left_winner = (left_player_flag !== null && left_player_flag >= 1);
            right_winner = (left_player_flag !== null && left_player_flag < 1);
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
        if (left_player_flag !== null) {
            if (left_player_flag === -1) {
                item['left_out'] = true;
            } else if (event_name.includes('hokei') && left_player_flag === 4) {
                item['right_out'] = true;
            } else if (event_name.includes('zissen') && left_player_flag === 2) {
                item['right_out'] = true;
            }
        }
        item['round']
        return (
                <>
                <Rect
            x={pointX + (has_left ? lineWidth + (item['round']-2)*30 : 0) * (is_left ? 1 : -1)}
            y={item['left_begin_y']}
            fill={(left_winner || (has_left && right_winner)) ? 'red' : 'black'}
            width={(has_left ? 30 : lineWidth + (item['round']-1)*30) * (is_left ? 1 : -1)}
            height={(left_winner || (has_left && right_winner)) ? 5 : 1} />
                <Rect
            x={pointX + (has_right ? lineWidth + (item['round']-2)*30 : 0) * (is_left ? 1 : -1)}
            y={item['right_begin_y']}
            fill={(right_winner || (has_right && left_winner)) ? 'red' : 'black'}
            width={(has_right ? 30 : lineWidth + (item['round']-1)*30) * (is_left ? 1 : -1)}
            height={(right_winner || (has_right && left_winner)) ? 5 : 1} />
                <Text
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 10:
               pointX - lineWidth - (item['round']-1)*30}
            y={is_left ? item['left_begin_y'] - 15 : item['left_begin_y'] + 4}
            text={((event_name.includes('hokei') && left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? left_player_flag : "")}
            fill={'blue'}
            fontSize={15} />
                <Text
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 10:
               pointX - lineWidth - (item['round']-1)*30}
            y={is_left ? item['right_begin_y'] + 4: item['right_begin_y'] - 15}
            text={((event_name.includes('hokei') && left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? (3 - left_player_flag) : "")}
            fill={'blue'}
            fontSize={15} />
                <Rect
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 :
               pointX - lineWidth - (item['round']-1)*30}
            y={is_left ? item['left_begin_y'] : item['right_begin_y']}
            fill={upper_focus ? 'red' : 'black'}
            width={upper_focus ? 5 : 1}
            height={(item['left_begin_y'] - item['right_begin_y']) * 0.5 * (is_left ? -1 : 1) + ('offset_y' in item ? item['offset_y'] : 0)} />
                <Rect
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 :
               pointX - lineWidth - (item['round']-1)*30}
            y={(item['left_begin_y'] + item['right_begin_y']) * 0.5 + ('offset_y' in item ? item['offset_y'] : 0)}
            fill={lower_focus ? 'red' : 'black'}
            width={lower_focus ? 5 : 1}
            height={(item['left_begin_y'] - item['right_begin_y']) * 0.5 * (is_left ? -1 : 1) + (lower_focus ? 4 : 0) - ('offset_y' in item ? item['offset_y'] : 0)} />
                <Rect
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 22 :
               pointX - lineWidth - (item['round']-1)*30 - 3}
            y={(item['left_begin_y'] + item['right_begin_y']) * 0.5 - 5 + ('offset_y' in item ? item['offset_y'] : 0) - 10}
            width={30}
            height={30}
            strokeWidth={2}
            cornerRadius={5}
            onClick={e => onUpdate(item['id'], editable)}
            onTap={e => onUpdate(item['id'], editable)}
                />
                <Text
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 15 :
               pointX - lineWidth - (item['round']-1)*30 + 5}
            y={(item['left_begin_y'] + item['right_begin_y']) * 0.5 - 5 + ('offset_y' in item ? item['offset_y'] : 0)}
            text={(item['id'] < 10 ? ' ' + item['id'] : item['id'])}
            fill={'gray'}
            fontSize={12}
            onClick={e => onUpdate(item['id'], editable)}
            onTap={e => onUpdate(item['id'], editable)}
                />
                </>
        );
    }
    return (
        <>
       </>
    );
}

function GetResult({editable = false, updateInterval = 0, returnUrl = null, event_name = null, block_number = null, freeze = 0}) {
    const router = useRouter();
    if (returnUrl === null) {
        returnUrl = event_name + '_result';
    }
    const onBack = () => {
        router.push('/admin/block?block_number=' + block_number);
    }

    const [data, setData] = useState([]);
    useEffect(() => {
      async function fetchData() {
          const response = await fetch('/api/get_result?event_name=' + event_name + '&freeze=' + freeze);
          const result = await response.json();
          setData(result);
      }
        fetchData();
      if (updateInterval > 0) {
          const interval = setInterval(() => {
              fetchData();
          }, updateInterval);
          return () => {
              clearInterval(interval);
          };
      }
    }, []);
    const sortedData = data.sort((a, b) => a.id - b.id);
    const lineWidth = 50;
    let maxHeight = 0;
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        if ('left_begin_y' in data[i] &&
            maxHeight < data[i]['left_begin_y']) {
            maxHeight = data[i]['left_begin_y'];
        }
        if ('right_begin_y' in data[i] &&
            maxHeight < data[i]['right_begin_y']) {
            maxHeight = data[i]['right_begin_y'];
        }
    }
    // TODO: from DB
    let event_full_name;
    if (event_name === 'hokei_man') {
        event_full_name = '男子個人法形競技';
    } else if (event_name === 'zissen_man') {
        event_full_name = '男子個人実戦競技';
    } else if (event_name === 'hokei_woman') {
        event_full_name = '女子個人法形競技';
    } else if (event_name === 'zissen_woman') {
        event_full_name = '女子個人実戦競技';
    } else if (event_name === 'hokei_sonen') {
        event_full_name = '壮年法形競技';
    }
  return (
          <div>
          <Container maxWidth="md">
          <Box style={{ minWidth: '850px' }}>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '100px' }}>
          <h1>{event_full_name}</h1>
          </Grid>
          <Stage width={850} height={maxHeight + 50}>
          <Layer>
          {sortedData.map((item, index) => (
              createBlock(item, lineWidth, editable, event_name, returnUrl)
          ))}
      {sortedData.map((item, index) => (
          createText(item, lineWidth)
          ))
          }
          </Layer>
          </Stage>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '120px' }}>
          <table border="1" style={{ width: '800px' }}>
          <tbody>
          <tr style={{ fontSize: '12px'}}>
          <td>優勝　</td>
          <td>第2位</td>
          <td>第3位</td>
          <td>第4位</td></tr>
          <tr style={{ height: '60px' }}><td></td><td></td><td></td><td></td></tr>
          </tbody>
          </table>
          </Grid>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '70px' }}>
          {block_number !== null ?
           <Button variant="contained" type="submit" onClick={e => onBack()}>戻る</Button> : <></>
          }
          </Grid>
          </Box>
          </Container>
          <br/>
          <br/>
          </div>
  );
}

export default GetResult;
