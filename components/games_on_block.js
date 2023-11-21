import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';
import checkStyles from '../styles/checks.module.css';

function onMoveDown(order_id, block_number) {
    let post = {update_block: block_number,
                target_order_id: order_id};
    axios.post('/api/change_order', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
    window.location.reload();
}

function GamesOnBlock({block_number, event_name}) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };

  const [data, setData] = useState([]);
  useEffect(() => {
      async function fetchData() {
      const response = await fetch('/api/get_games_on_block?block_number=' + block_number);
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
          <table border="1">
          <tbody>
          <tr className={checkStyles.column}>
          {event_name === 'hokei_man' ? (<th>種類</th>) : (<></>)}
          <th>地区</th>
          <th>選手(赤)</th>
          <th>カナ</th>
          <th>地区</th>
          <th>選手(白)</th>
          <th>カナ</th>
          <th>順序変更</th>
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column} bgcolor={'current' in item ? 'yellow' : 'white'}>
                  {event_name === 'hokei_man' ? (<td>{item['round'] <= 2 ? '指定法形' : '自由法形'}</td>) : (<></>)}
                  <td>{item['left_color'] === 'red' ? item['left_group_name'] : item['right_group_name']}</td>
                  <td>{item['left_color'] === 'red' ? item['left_name'] : item['right_name']}</td>
                  <td>{item['left_color'] === 'red' ? item['left_name_kana'] : item['right_name_kana']}</td>
                  <td>{item['left_color'] === 'red' ? item['right_group_name'] : item['left_group_name']}</td>
                  <td>{item['left_color'] === 'red' ? item['right_name'] : item['left_name']}</td>
                  <td>{item['left_color'] === 'red' ? item['right_name_kana'] : item['left_name_kana']}</td>
                  <td><Button variant="contained" type="submit" onClick={e => onMoveDown(item.order_id, block_number)}>▼</Button></td>
                  </tr>
          ))}
          </tbody>
          </table>
          </div>
  );
}

export default GamesOnBlock;
