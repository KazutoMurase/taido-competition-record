import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';
import SquareTwoToneIcon from '@mui/icons-material/SquareTwoTone';
import checkStyles from '../styles/checks.module.css';


function onSubmit(data) {
    let post = {event_id: 2,
                player_id: data.id,
                court_id: 1
                };
    axios.post('/api/create_notification_request', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
}

function onBack(data) {
    let post = {id: data.id-1,
                update_block: 'a'};
    axios.post('/api/hokei_man/back', post)
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
      const response = await fetch('/api/check_block_a');
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, []);
  return (
          <div>
          <Grid container>
          <Grid item xs={5} />
          <Grid item xs={5}>
          <h2><u>コートA</u></h2>
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
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column}>
                  <td><SquareTwoToneIcon sx={{ fontSize: 60 }} htmlColor={item['color'] === 'red' ? 'red' : 'gray'} /></td>
                  <td>{item['name']}({item['name_kana']})</td>
                  <td className={checkStyles.elem}><input type='checkbox' className={checkStyles.large_checkbox} /></td>
                  <td className={checkStyles.elem}><input type='checkbox' className={checkStyles.large_checkbox} /></td>
                  <td><Button variant="contained" type="submit" onClick={e => onSubmit(item)}>呼び出し</Button></td>
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

export default Home;
