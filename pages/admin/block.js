import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import React from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import checkStyles from '../../styles/checks.module.css';

function ShowDetails(item, block_number, current, ToCall, ToRecord, ToUpdate) {
    if (item["name"].includes("団体")) {
        return (<>
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                <Button variant="contained" type="submit" onClick={e => ToCall(block_number, item['id'])} disabled={item['id'] !== current.id || !item['players_checked']}>競技終了</Button>
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                &nbsp;&nbsp;
                </>);
    }
    return (<>
            <Button variant="contained" type="submit" onClick={e => ToCall(block_number, item['id'])} disabled={item['id'] !== current.id || !item['players_checked']}>呼び出し</Button>
            &nbsp;&nbsp;
            <Button variant="contained" type="submit" onClick={e => ToRecord(block_number, item['id'])} disabled={item['id'] !== current.id || !item['players_checked']}>記録</Button>
            &nbsp;&nbsp;
            <Button variant="contained" type="submit" onClick={e => ToUpdate(block_number, item['id'])} disabled={item['id'] > current.id || !item['players_checked']}>結果修正</Button>
           </>);
}

function ShowGamesText(item) {
    let prefix = '';
    if (item['before_final']) {
        prefix += '三決';
    }
    if (item['final']) {
        prefix += '決勝';
    }
    if (prefix !== '') {
        prefix = '【' + prefix + '】';
    }
    if (item["name"].includes("団体展開") || item["name"].includes("団体法形")) {
        return prefix + '';
    }
    return prefix + item['games_text'];
}

export default function Home() {
    const router = useRouter();
    const { block_number } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    const ToCheck = (block_number, id) => {
        router.push("/admin/check_players_on_block?block_number=" + block_number + "&schedule_id=" + id);
    };
    const ToCall = (block_number, id) => {
        router.push("/admin/games_on_block?block_number=" + block_number + "&schedule_id=" + id);
    };
    const ToRecord = (block_number, id) => {
        router.push("/admin/record_result?block_number=" + block_number + "&schedule_id=" + id);
    };
    const ToUpdate = (block_number, id) => {
        router.push("/admin/check_result?block_number=" + block_number + "&schedule_id=" + id);
    };
    const ToBack = () => {
        router.push("/admin");
    }
    const [data, setData] = useState([]);
    const [current, setCurrent] = useState([]);
  useEffect(() => {
      async function fetchData() {
      const response = await fetch('/api/get_time_schedule?block_number=' + block_number);
      const result = await response.json();
      setData(result);
      }
    const interval = setInterval(() => {
      fetchData();
    }, 3000); // 3秒ごとに更新
      fetchData();
      return () => {
          clearInterval();
      };
  }, []);
  useEffect(() => {
      async function fetchData() {
      const response = await fetch('/api/current_schedule?block_number=' + block_number);
      const result = await response.json();
      setCurrent(result);
   }
    const interval = setInterval(() => {
      fetchData();
    }, 3000); // 3秒ごとに更新
      fetchData();
      return () => {
          clearInterval();
      };
  }, []);
    const doneButtonStyle = {
        backgroundColor: 'purple'
    };
    return (
            <div>
            <h1>Aコート</h1>
            <table border="1">
            <tbody>
            <tr className={checkStyles.column}>
            <th>競技</th><th>時間</th><th>試合番号</th><th>試合数</th><th></th>
            </tr>
            {data.map((item, index) => (
                    <tr className={checkStyles.column} bgcolor={item['id'] === current.id ? 'yellow' : 'white'}>
                    <td>{item['name'].replace('\'', '').replace('\'', '')}</td>
                    <td>{item['time_schedule'].replace('\'', '').replace('\'', '')}</td>
                    <td>{ShowGamesText(item)}</td>
                    <td>{('game_count' in item ? item['game_count'] + '試合' : '')}</td>
                    <td>
                    <Button variant="contained" type="submit" onClick={e => ToCheck(block_number, item['id'])} style={item['players_checked'] ? doneButtonStyle : null} >{item['players_checked'] ? '点呼完了' : '　点呼　'}</Button>
                    &nbsp;&nbsp;
                {ShowDetails(item, block_number, current, ToCall, ToRecord, ToUpdate)}
                    </td>
                    </tr>
            ))
            }
            </tbody>
            </table>
            <br/><br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <Button variant="contained" type="submit" onClick={e => ToBack()}>戻る</Button>
            </Grid>
            </div>
    )
}
