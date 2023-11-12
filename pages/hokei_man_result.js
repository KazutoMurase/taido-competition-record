import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Layer, Stage, Rect, Text } from "react-konva";
import Grid from '@mui/material/Grid';

// TODO: for mobile, onTap should be added in konva-text
function createText(item) {
    const is_left = (item['block_pos'] === 'left');
    const is_right = (item['block_pos'] === 'right');
    const has_left = ('has_left' in item);
    const has_right = ('has_right' in item);
    if (is_left || is_right) {
        if (!has_left && !has_right) {
            return (<>
                    <Text
                    x={is_left ? 80 : 820}
                    y={item['left_begin_y']-20}
                    text={item['left_name_kana']}
                    fontSize={12}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['left_begin_y']-18}
                    width={['left_name_kana'].length*120}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                    x={is_left ? 80 : 820}
                    y={item['left_begin_y']-5}
                    text={item['left_name']}
                    fontSize={20}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['left_begin_y']}
                    width={['left_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                    x={is_left ? 210 : 950}
                    y={item['left_begin_y']}
                    text={item['left_group_name'].replace('\'', '【').replace('\'', '】')}
                    fontSize={14}
                    />
                    <Rect
                    x={is_left ? 210 : 950}
                    y={item['left_begin_y']+5}
                    width={['left_group_name'].length*80}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                    x={is_left ? 80 : 820}
                    y={item['right_begin_y']-20}
                    text={item['right_name_kana']}
                    fontSize={12}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['right_begin_y']-18}
                    width={['right_name_kana'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                    x={is_left ? 80 : 820}
                    y={item['right_begin_y']-5}
                    text={item['right_name']}
                    fontSize={20}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['right_begin_y']}
                    width={['right_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                    x={is_left ? 210 : 950}
                    y={item['right_begin_y']}
                    text={item['right_group_name'].replace('\'', '【').replace('\'', '】')}
                    fontSize={14}
                    />
                    <Rect
                    x={is_left ? 210 : 950}
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
                x={is_left ? 80 : 820}
                y={item['left_begin_y']-20}
                text={item['left_name_kana']}
                fontSize={12}
                    />
                    <Rect
                x={is_left ? 80-10 : 820-10}
                y={item['left_begin_y']-18}
                width={['left_name_kana'].length*120}
                height={1}
                fill='black'
                visible={'left_out' in item}
                    />
                    <Text
                x={is_left ? 80 : 820}
                y={item['left_begin_y']-5}
                text={item['left_name']}
                fontSize={20}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['left_begin_y']}
                    width={['left_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'left_out' in item}
                    />
                    <Text
                x={is_left ? 210 : 950}
                y={item['left_begin_y']}
                text={item['left_group_name'].replace('\'', '【').replace('\'', '】')}
                fontSize={14}
                    />
                    <Rect
                    x={is_left ? 210 : 950}
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
                x={is_left ? 80 : 820}
                y={item['right_begin_y']-20}
                text={item['right_name_kana']}
                fontSize={12}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['right_begin_y']-18}
                    width={['right_name_kana'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                x={is_left ? 80 : 820}
                y={item['right_begin_y']-5}
                text={item['right_name']}
                fontSize={20}
                    />
                    <Rect
                    x={is_left ? 80-10 : 820-10}
                    y={item['right_begin_y']}
                    width={['right_name'].length*120}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    <Text
                x={is_left ? 210 : 950}
                y={item['right_begin_y']}
                text={item['right_group_name'].replace('\'', '【').replace('\'', '】')}
                fontSize={14}
                    />
                    <Rect
                    x={is_left ? 210 : 950}
                    y={item['right_begin_y']+5}
                    width={['right_group_name'].length*80}
                    height={1}
                    fill='black'
                    visible={'right_out' in item}
                    />
                    </>
            );
        }
    }
    return (<>
            </>
           );
}

function createBlock(item, lineWidth) {
    const router = useRouter();

    const onUpdate = (id) => {
        router.push('/hokei_man?id=' + id);
    }

    const is_left = (item['block_pos'] === 'left');
    const is_right = (item['block_pos'] === 'right');
    const pointX = (is_left ? 300 : 800);
    if (!is_left && !is_right) {
        if ('left_begin_y' in item &&
            'right_begin_y' in item) {
            const x = 300 + lineWidth + (item['round']-2)*30;
            const width = ((800 - lineWidth - (item['round']-2)*30) -
                           (300 + lineWidth + (item['round']-2)*30));
            return (<>
                    <Rect
                    x={x}
                    y={item['left_begin_y']}
                    width={width}
                    height={1}
                    fill='black'
                    />
                    <Rect
                    x={x + width / 2}
                    y={item['left_begin_y']}
                    width={1}
                    height={-50}
                    fill='black'
                    />
                    <Text
                    x={x + width / 2 - 20}
                    y={item['left_begin_y'] - 70}
                    text={'決勝'}
                    fontSize={20}
                    />
                    <Text
                    x={x + width / 2 - 8}
                    y={item['left_begin_y'] + 5}
                    text={item['id']}
                    fill={'gray'}
                    fontSize={12}
                    />
                    </>);
        } else {
            const x = 300 + lineWidth + (item['fake_round']-2)*30;
            const width = ((800 - lineWidth - (item['fake_round']-2)*30) -
                           (300 + lineWidth + (item['fake_round']-2)*30));
        return (
                <>
                <Rect
            x={x}
            y={700}
            width={width}
            height={1}
            fill='black'
                />
                <Rect
            x={x + width / 2}
            y={700}
            width={1}
            height={-50}
            fill='black'
                />
                <Text
            x={x + width / 2 - 20}
            y={700 - 70}
            text={'三決'}
            fontSize={20}
                />
                <Text
            x={x + width / 2 - 8}
            y={700 + 5}
            text={item['id']}
            fill={'gray'}
            fontSize={12}
                />
                </>
        );
        }
    }
    if ('left_begin_y' in item &&
        'right_begin_y' in item) {
        const has_left = ('has_left' in item);
        const has_right = ('has_right' in item);
        const left_player_flag = item['left_player_flag'];
        const left_winner = (left_player_flag !== null && left_player_flag >= 2);
        const right_winner = (left_player_flag !== null && left_player_flag < 2);
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
                if (is_left) {
                    item['left_out'] = true;
                } else {
                    item['right_out'] = true;
                }
            } else if (left_player_flag === 4) {
                if (is_left) {
                    item['right_out'] = true;
                } else {
                    item['left_out'] = true;
                }
            }
        }
        return (
                <>
                <Rect
            x={pointX + (has_left ? lineWidth + (item['round']-2)*30 : 0) * (is_left ? 1 : -1)}
            y={item['left_begin_y']}
            fill={left_winner ? 'red' : 'black'}
            width={(has_left ? 30 : lineWidth + (item['round']-1)*30) * (is_left ? 1 : -1)}
            height={left_winner ? 5 : 1} />
                <Rect
            x={pointX + (has_right ? lineWidth + (item['round']-2)*30 : 0) * (is_left ? 1 : -1)}
            y={item['right_begin_y']}
            fill={right_winner ? 'red' : 'black'}
            width={(has_right ? 30 : lineWidth + (item['round']-1)*30) * (is_left ? 1 : -1)}
            height={right_winner ? 5 : 1} />
                <Text
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 10:
               pointX - lineWidth - (item['round']-1)*30}
            y={is_left ? item['left_begin_y'] - 15 : item['left_begin_y'] + 4}
            text={((left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? left_player_flag : "")}
            fill={'blue'}
            fontSize={15} />
                <Text
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 10:
               pointX - lineWidth - (item['round']-1)*30}
            y={is_left ? item['right_begin_y'] + 4: item['right_begin_y'] - 15}
            text={((left_player_flag !== null && left_player_flag >= 0 && left_player_flag <= 3) ? (3 - left_player_flag) : "")}
            fill={'blue'}
            fontSize={15} />
                <Rect
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 :
               pointX - lineWidth - (item['round']-1)*30}
            y={is_left ? item['left_begin_y'] : item['right_begin_y']}
            fill={upper_focus ? 'red' : 'black'}
            width={upper_focus ? 5 : 1}
            height={(item['left_begin_y'] - item['right_begin_y']) * 0.5 * (is_left ? -1 : 1)} />
                <Rect
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 :
               pointX - lineWidth - (item['round']-1)*30}
            y={(item['left_begin_y'] + item['right_begin_y']) * 0.5}
            fill={lower_focus ? 'red' : 'black'}
            width={lower_focus ? 5 : 1}
            height={(item['left_begin_y'] - item['right_begin_y']) * 0.5 * (is_left ? -1 : 1) + (lower_focus ? 4 : 0)} />
                <Text
            x={is_left ?
               pointX + lineWidth + (item['round']-1)*30 - 15 :
               pointX - lineWidth - (item['round']-1)*30 + 5}
            y={(item['left_begin_y'] + item['right_begin_y']) * 0.5 - 5}
            text={(item['id'] < 10 ? ' ' + item['id'] : item['id'])}
            fill={'gray'}
            fontSize={12}
            onClick={e => onUpdate(item['id'])}
                />
                </>
        );
    }
    return (
        <>
       </>
    );
}

function Home() {
    const [data, setData] = useState([]);
    useEffect(() => {
        async function fetchData() {
            const response = await fetch('/api/hokei_man');
            const result = await response.json();
            setData(result);
        }
        fetchData();
    }, []);
    const sortedData = data.sort((a, b) => a.id - b.id);
    const lineWidth = 60;
  return (
          <div>
          <Grid container>
          <Grid ime xs={5} />
          <Grid item xs={4}>
          <h1>男子個人法形競技</h1>
          </Grid>
          </Grid>
          <Stage width={1100} height={900}>
          <Layer>
          {sortedData.map((item, index) => (
              createBlock(item, lineWidth)
          ))}
          {sortedData.map((item, index) => (
              createText(item)
          ))
          }
          </Layer>
          </Stage>
          </div>
  );
}

export default Home;
