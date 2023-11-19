import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';
import SquareTwoToneIcon from '@mui/icons-material/SquareTwoTone';
import checkStyles from '../styles/checks.module.css';
import { useRouter } from 'next/router';


function onSubmit(id, block_number) {
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
    let post = {event_id: 2,
                player_id: id,
                court_id: court_id
                };
    axios.post('/api/create_notification_request', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
}

function onClear(id) {
    let post = {player_id: id};
    axios.post('/api/clear_notification_request', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
}

function CheckPlayers({block_number}) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };
  let title;

  const [data, setData] = useState([]);
  useEffect(() => {
      async function fetchData() {
      const response = await fetch('/api/check_players_on_block?block_number=' + block_number);
      const result = await response.json();
      setData(result);
   }
    const interval = setInterval(() => {
      fetchData();
    }, 3000); // 3秒ごとに更新
      fetchData();
    return () => {
      clearInterval(interval);
    };
  }, []);

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
          <table border="1">
          <tbody>
          <tr className={checkStyles.column}>
          <th>色</th>
          <th>選手名</th>
          <th>点呼完了</th>
          <th>棄権</th>
          <th></th>
          <th></th>
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column}>
                  <td><SquareTwoToneIcon sx={{ fontSize: 60 }} htmlColor={item['color'] === 'red' ? 'red' : 'gray'} /></td>
                  <td>{item['name']}({item['name_kana']})</td>
                  <td className={checkStyles.elem}><input type='checkbox' className={checkStyles.large_checkbox} /></td>
                  <td className={checkStyles.elem}><input type='checkbox' className={checkStyles.large_checkbox} /></td>
                  <td><Button variant="contained" type="submit" onClick={e => onSubmit(item.id, block_number)} style={!item['requested'] ? null : activeButtonStyle}>{!item['requested'] ? '　呼び出し　' : 'リクエスト済'}</Button></td>
                  <td><Button variant="contained" type="submit" onClick={e => onClear(item.id)} disabled={!item['requested']}>キャンセル</Button></td>
              </tr>
          ))}
          </tbody>
          </table>
          </Grid>
          <Grid item xs={1} />
          <Grid item xs={4} />
          <Grid item xs={2}>
          <br />
          <Button variant="contained" type="submit">決定</Button>
          </Grid>
          </Grid>
          </div>
  );
}

export default CheckPlayers;
