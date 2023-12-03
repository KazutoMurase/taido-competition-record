import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';
import SquareTwoToneIcon from '@mui/icons-material/SquareTwoTone';
import checkStyles from '../styles/checks.module.css';

function onClearAll(is_test, function_after_post) {
    let post = {is_test: is_test};
    axios.post('/api/clear_notification_request', post)
        .then((response) => {
            function_after_post();
        })
        .catch((e) => { console.log(e)})
}

function onClear(item, is_test, function_after_post) {
    let post = {is_test: is_test};
    if ('name' in item) {
        post = {player_id: item.id};
    } else {
        post = {group_id: item.group_id, event_id: item.event_id};
    }
    axios.post('/api/clear_notification_request', post)
        .then((response) => {
            function_after_post();
        })
        .catch((e) => { console.log(e)})
}

function ShowName(item) {
    if ('name' in item) {
        return (item['name'] + '(' + item['name_kana'] + ')');
    }
    return item['group_name'].replace('\'', '').replace('\'', '') + 'チーム';
}

function NotificationRequest({update_interval, return_url, is_test = false}) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };
  const router = useRouter();
  const ToBack = () => {
      router.push(return_url);
  }

  const fetchData = async () => {
      const response = await fetch('/api/notification_request?is_test=' + is_test);
      const result = await response.json();
      setData(result);
  }
  const [data, setData] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, update_interval);
    fetchData();
    return () => {
      clearInterval(interval);
    };
  }, []);

    const forceFetchData = () => {
        fetchData();
    };

  return (
          <div>
          <Container maxWidth="md">
          <Box style={{ minWidth: '720px' }}>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '80px' }}>
          <h2><u>呼び出しリスト</u></h2>
          </Grid>
          <table border="1">
          <tbody>
          <tr className={checkStyles.column}>
          <th>競技</th>
          <th>選手/団体名</th>
          <th>コート</th>
          <th>所属</th>
          <th></th>
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column}>
                  <td>{item['event_name'].replace('\'', '').replace('\'', '')}</td>
                  <td>{ShowName(item)}</td>
                  <td>{item['court_name'].replace('\'', '').replace('\'', '')}</td>
                  <td>{'name' in item ? item['group_name'].replace('\'', '').replace('\'', '') : ''}</td>
                  <td><Button variant="contained" type="submit" onClick={e => onClear(item, is_test, forceFetchData)}>呼び出し完了</Button></td>
              </tr>
          ))}
          </tbody>
          </table>
          <br />
          <Grid container justifyContent="center" alignItems="center" style={{ height: '100px' }}>
          <Button variant="contained" type="submit" onClick={e => onClearAll(is_test, forceFetchData)}>全呼び出し完了</Button>
          &nbsp;&nbsp;
          <Button variant="contained" type="submit" onClick={e => ToBack()}>戻る</Button>
          </Grid>
          </Box>
          </Container>
          </div>
  );
}

export default NotificationRequest;
