import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';
import SquareTwoToneIcon from '@mui/icons-material/SquareTwoTone';
import checkStyles from '../styles/checks.module.css';

function onClearAll() {
    let post = {};
    axios.post('/api/clear_notification_request', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
    window.location.reload();
}

function onClear(id) {
    let post = {player_id: id};
    axios.post('/api/clear_notification_request', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
    window.location.reload();
}


function Home() {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };

  const [data, setData] = useState([]);
  useEffect(() => {
      async function fetchData() {
      const response = await fetch('/api/notification_request');
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
  return (
          <div>
          <Grid container>
          <Grid item xs={4} />
          <Grid item xs={6}>
          <h2><u>呼び出しリスト</u></h2>
          </Grid>
          <Grid item xs={2} />
          <Grid item xs={1} />
          <Grid item xs={1} />
          <Grid item xs={10}>
          <table border="1">
          <tbody>
          <tr className={checkStyles.column}>
          <th>競技</th>
          <th>選手名</th>
          <th>コート</th>
          <th></th>
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column}>
                  <td>{item['event_name'].replace('\'', '').replace('\'', '')}</td>
                  <td>{item['name']}({item['name_kana']})</td>
                  <td>{item['court_name'].replace('\'', '').replace('\'', '')}</td>
                  <td><Button variant="contained" type="submit" onClick={e => onClear(item.id)}>呼び出し完了</Button></td>
              </tr>
          ))}
          </tbody>
          </table>
          </Grid>
          <Grid item xs={1} />
          <Grid item xs={4} />
          <Grid item xs={2}>
          <br />
          <Button variant="contained" type="submit" onClick={e => onClearAll()}>全呼び出し完了</Button>
          </Grid>
          </Grid>
          </div>
  );
}

export default Home;
