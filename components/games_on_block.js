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

function onMoveDown(order_id, block_number, schedule_id, function_after_post) {
    let post = {update_block: block_number,
                schedule_id: schedule_id,
                target_order_id: order_id};
    axios.post('/api/change_order', post)
        .then((response) => {
            function_after_post();
        })
        .catch((e) => { console.log(e)})
}

function ShowHokeiType(item, event_name) {
    if (event_name === 'hokei_sonen') {
        return (<td>{item['round'] <= 2 ? '勢命' : '活命/延命'}</td>);
    }
    return (<td>{item['round'] <= 2 ? '指定法形' : '自由法形'}</td>);
}


function GamesOnBlock({block_number, event_name, schedule_id, update_interval}) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };
    const router = useRouter();

  const [data, setData] = useState([]);
  const fetchData = async () => {
      const response = await fetch('/api/get_games_on_block?block_number=' + block_number + "&schedule_id=" + schedule_id + "&event_name=" + event_name);
      const result = await response.json();
      if (result.length === 0) {
          router.push("block?block_number=" + block_number);
      }
      setData(result);
  }
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
    const retireButtonStyle = {
        backgroundColor: 'gray',
        fontSize: '10px'
    };

    const [leftRetireStates, setLeftRetireStates] = useState([]);
    const [rightRetireStates, setRightRetireStates] = useState([]);

    const handleLeftRetireStatesChange = (id) => {
        setLeftRetireStates((prevStates) => {
            const stateExists = prevStates.some((state) => state.id === id);
            if (!stateExists) {
                return [
                ...prevStates,
                {id : id, is_retired: true},
                ];
            }
            return prevStates.map((state) =>
                                  state.id === id
                                  ? { ...state, is_retired: !state.is_retired }
                                  : state)
        });
    }
    const handleRightRetireStatesChange = (id) => {
        setRightRetireStates((prevStates) => {
            const stateExists = prevStates.some((state) => state.id === id);
            if (!stateExists) {
                return [
                ...prevStates,
                {id : id, is_retired: true},
                ];
            }
            return prevStates.map((state) =>
                                  state.id === id
                                  ? { ...state, is_retired: !state.is_retired }
                                  : state)
        });
    }

    const showText = (left_color,
                      left_retire, left_text,
                      right_retire, right_text, id, target_col) => {
                          let target_states = (target_col === 'left' ? leftRetireStates : rightRetireStates);
                          for (let i = 0; i < target_states.length; i++) {
                              if (id === target_states[i].id) {
                                  if (target_states[i]['is_retired']) {
                                      return (<s>{left_color === 'red' ? left_text : right_text}</s>);
                                  } else {
                                      return (<span>{left_color === 'red' ? left_text : right_text}</span>);
                                  }
                              }
                          }
                          if ((left_color === 'red' && left_retire) ||
                              (left_color !== 'red' && right_retire)) {
                              return (<s>{left_color === 'red' ? left_text : right_text}</s>);
                          }
                          return (<span>{left_color === 'red' ? left_text : right_text}</span>);
                      };
    const last_order_id = data.length;
    let current_order_id = -1;
    for (let i = 0; i < data.length; i++) {
        if ('current' in data[i]) {
            current_order_id = i + 1;
            break;
        }
    }
  return (
          <div>
          <Container maxWidth="md">
          <Box style={{ minWidth: '950px' }}>
          <Grid container justifyContent="flex-start" alignItems="center">
          <table border="1">
          <tbody>
          <tr className={checkStyles.column}>
          {event_name.includes('hokei') ? (<th>種類</th>) : (<></>)}
          <th>色</th>
          <th>地区</th>
          <th>選手(カナ)</th>
          <th>色</th>
          <th>地区</th>
          <th>選手(カナ)</th>
          <th>順序変更</th>
          {event_name.includes('zissen') ? (<th>赤棄権</th>) : (<></>)}
          {event_name.includes('zissen') ? (<th>白棄権</th>) : (<></>)}
          </tr>
          {data.map((item, index) => (
                  <tr className={checkStyles.column} bgcolor={'current' in item ? 'yellow' : 'white'}>
                  {event_name.includes('hokei') ? ShowHokeiType(item, event_name) : (<></>)}
                  <td>
                  <SquareTwoToneIcon sx={{ fontSize: 30 }} htmlColor={'red'} />
                  </td>
                  <td>{item['left_color'] === 'red' ? item['left_group_name'] : item['right_group_name']}</td>
                  <td>
                  {showText(item['left_color'],
                            item['left_retire'],
                            item['left_name'],
                            item['right_retire'],
                            item['right_name'], item['id'], 'left')}
              {showText(item['left_color'],
                        item['left_retire'],
                        item['left_name_kana'] !== null ? "(" + item['left_name_kana'] + ")" : "",
                        item['right_retire'],
                        item["right_name_kana"] !== null ? "(" + item['right_name_kana'] + ")" : "",
                        item['id'], 'left')}
              </td>
                  <td>
                  <SquareTwoToneIcon sx={{ fontSize: 30 }} htmlColor={'gray'} />
              </td>
                  <td>
                  {item['left_color'] === 'red' ? item['right_group_name'] : item['left_group_name']}
              </td>
                  <td>
                  {showText(item['left_color'],
                            item['right_retire'],
                            item['right_name'],
                            item['left_retire'],
                            item['left_name'],
                            item['id'], 'right')}
              {showText(item['left_color'],
                        item['right_retire'],
                        item["right_name_kana"] !== null ? "(" + item['right_name_kana'] + ")" : "",
                        item['left_retire'],
                        item['left_name_kana'] !== null ? "(" + item['left_name_kana'] + ")" : "",
                        item['id'], 'right')}
              </td>
                  <td><Button variant="contained" type="submit" disabled={current_order_id > item['order_id'] || last_order_id===item['order_id']} onClick={e => onMoveDown(item.order_id, block_number, schedule_id, forceFetchData)}>▼</Button></td>
                  {event_name.includes('zissen') ? (<td><Button size="small" style={retireButtonStyle} variant="contained" type="submit" onClick={e => handleLeftRetireStatesChange(item.id)}>Check</Button></td>) : (<></>)}
                  {event_name.includes('zissen') ? (<td><Button size="small" style={retireButtonStyle} variant="contained" type="submit" onClick={e => handleRightRetireStatesChange(item.id)}>Check</Button></td>) : (<></>)}
                  </tr>
          ))}
          </tbody>
          </table>
          </Grid>
          </Box>
          </Container>
          </div>
  );
}

export default GamesOnBlock;
