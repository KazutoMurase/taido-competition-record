import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';
import SquareTwoToneIcon from '@mui/icons-material/SquareTwoTone';
import checkStyles from '../styles/checks.module.css';
import { useRouter } from 'next/router';


function onSubmit(block_number, group_id, event_id, function_after_post) {
    // TODO: FIXME
    let court_id;
    if (block_number === 'a') {
        court_id = 1;
    } else if (block_number === 'b') {
        court_id = 2;
    } else if (block_number === 'c') {
        court_id = 3;
    } else if (block_number === 'd') {
        court_id = 4;
    }
    let post = {event_id: event_id,
                group_id: group_id,
                court_id: court_id
                };
    axios.post('/api/create_notification_request', post)
        .then((response) => {
            function_after_post();
        })
        .catch((e) => { console.log(e)})
}

function onClear(item, function_after_post) {
    let post = {group_id: item.group_id,
                event_id: item.event_id};
    axios.post('/api/clear_notification_request', post)
        .then((response) => {
            function_after_post();
        })
        .catch((e) => { console.log(e)})
}

function CheckDantai({block_number, schedule_id, event_id}) {
    const router = useRouter();
    function onBack() {
        router.push("/admin/block?block_number=" + block_number);
    }

    function onFinish(block_number, schedule_id) {
        let post = {schedule_id: schedule_id,
                    block_number: block_number};
        console.log(post);
        axios.post('/api/complete_players_check', post)
            .then((response) => {
                console.log(response);
            })
            .catch((e) => { console.log(e)})
        router.push("/admin/block?block_number=" + block_number);
    }

  let title;

  const fetchData = async () => {
      const response = await fetch('/api/check_players_on_block?block_number=' + block_number + '&schedule_id=' + schedule_id + '&event_id=' + event_id);
      const result = await response.json();
      setData(result);
  }
  const [data, setData] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 3000); // 3秒ごとに更新
      fetchData();
    return () => {
      clearInterval(interval);
    };
  }, []);
    const forceFetchData = () => {
        fetchData();
    };

    const waitButtonStyle = {
        backgroundColor: 'blue'
    };
    const activeButtonStyle = {
        backgroundColor: 'purple'
    };

  return (
          <div>
          <Grid container>
          <Grid item xs={5} />
          <Grid item xs={5}>
          <h2><u>コート{block_number.toUpperCase()}</u></h2>
          </Grid>
          <Grid item xs={2} />
          <Grid item xs={1} />
          <Grid item xs={1} />
          <Grid item xs={10}>
          <h3 className={checkStyles.warn}>{(data.length > 0 && 'all' in data[0]) ? '※全団体が表示されていますので、点呼するべき団体を確認して下さい': ''}</h3>
          <table border="1">
          <tbody>
          <tr className={checkStyles.column}>
          <th>団体名</th>
          <th>点呼完了</th>
          <th>棄権</th>
          <th>{(data.length > 0 && 'all' in data[0]) ? '敗退': ''}</th>
          <th></th>
          <th></th>
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column}>
                  <td>{item['name'].replace('\'', '').replace('\'', '')}</td>
                  <td className={checkStyles.elem}>
                  <input type='radio' name={index} className={checkStyles.large_checkbox} />
                  </td>
                  <td className={checkStyles.elem}>
                  <input type='radio' name={index}  className={checkStyles.large_checkbox} />
                  </td>
                  <td>
                  {'all' in item ? (<input type='radio' name={index}  className={checkStyles.large_checkbox}/>): (<></>)}
                  </td>
                  <td><Button variant="contained" type="submit" onClick={e => onSubmit(block_number,
                                                                                       item.group_id,
                                                                                       item.event_id,
                                                                                       forceFetchData)} style={!item['requested'] ? null : activeButtonStyle}>{!item['requested'] ? '　呼び出し　' : 'リクエスト済'}
              </Button></td>
                  <td><Button variant="contained" type="submit" onClick={e => onClear(item, forceFetchData)} disabled={!item['requested']}>キャンセル</Button></td>
              </tr>
          ))}
          </tbody>
          </table>
          </Grid>
          <Grid item xs={1} />
          <Grid item xs={4} />
          <Grid item xs={2}>
          <br />
          <Button variant="contained" type="submit" onClick={e => onFinish(block_number, schedule_id)}>決定</Button>
          &nbsp;&nbsp;
          <Button variant="contained" type="submit" onClick={e => onBack()}>戻る</Button>
          </Grid>
          </Grid>
          </div>
  );
}

export default CheckDantai;
