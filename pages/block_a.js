import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';


function onSubmit(data, player_flag) {
    let left_player_flag = (data.left_color === 'white' ? player_flag : 3 - player_flag);
    let post = {id: data.id,
                left_player_flag: left_player_flag,
                update_block: 'a'};
    if (parseInt(left_player_flag) > 1) {
        post['next_player_id'] = data.left_player_id;
        post['loser_id'] = data.right_player_id;
    } else {
        post['next_player_id'] = data.right_player_id;
        post['loser_id'] = data.left_player_id;
    }
    if (data.next_left_id !== null) {
        post['next_id'] = data.next_left_id;
        post['next_type'] = 'left';
    } else {
        post['next_id'] = data.next_right_id;
        post['next_type'] = 'right';
    }
    axios.post('/api/hokei_man/record', post)
        .then((response) => {
            console.log(response);
        })
        .catch((e) => { console.log(e)})
    window.location.reload();
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
      const response = await fetch('/api/current_block_a');
      const result = await response.json();
      setData(result);
      if (result.left_player_flag !== null) {
          if (result.left_color === 'red') {
              setSelectedRadioButton(3 - result.left_player_flag);
          } else {
              setSelectedRadioButton(result.left_player_flag);
          }
      }
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
          <Grid item xs={4}>
          <h2><u>コートA</u></h2>
          <h2>第{data.id}試合</h2>
          </Grid>
          <Grid item xs={4} />
          <Grid item xs={1} />
          <Grid item xs={5}>
          <Button variant="contained"
          type="submit"
          onClick={e => onSubmit(data, -1)}>赤不戦勝</Button>
          <h1>{data.left_color === 'white' ? data.right_name : data.left_name}</h1>
          {parseInt(selectedRadioButton) <= 2 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
          {parseInt(selectedRadioButton) <= 1 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
          {parseInt(selectedRadioButton) === 0 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
          </Grid>
          <Grid item xs={5}>
          <Button variant="contained"
                  type="submit"
                  onClick={e => onSubmit(data, 4)}>白不戦勝</Button>
          <h1>{data.left_color === 'white' ? data.left_name : data.right_name}</h1>
          {parseInt(selectedRadioButton) >= 1 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> :
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="white" />}
          {parseInt(selectedRadioButton) >= 2 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
          {parseInt(selectedRadioButton) >= 3 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
          </Grid>
          <Grid item xs={1} />
          <Grid item xs={3} />
          <Grid item xs={4}>
          <h2>白の旗</h2>
          <input class="radio-inline__input" type="radio" id="choice0" name="contact" value="0"
          onChange={handleRadioButtonChange} defaultChecked={parseInt(selectedRadioButton)===0} />
          <label class="radio-inline__label" for="choice0">0</label>
          <input class="radio-inline__input" type="radio" id="choice1" name="contact" value="1"
          onChange={handleRadioButtonChange}  defaultChecked={parseInt(selectedRadioButton)===1} />
          <label class="radio-inline__label" for="choice1">1</label>
          <input class="radio-inline__input" type="radio" id="choice2" name="contact" value="2"
          onChange={handleRadioButtonChange}  defaultChecked={parseInt(selectedRadioButton)===2} />
          <label class="radio-inline__label" for="choice2">2</label>
          <input class="radio-inline__input" type="radio" id="choice3" name="contact" value="3"
          onChange={handleRadioButtonChange}  defaultChecked={parseInt(selectedRadioButton)===3} />
          <label class="radio-inline__label" for="choice3">3</label>
          <br />
          <br />
          </Grid>
          <Grid item xs={5} />
          <Grid item xs={4} />
          <Grid item xs={1} >
          <Button variant="contained"
                  type="submit"
                  onClick={e => onSubmit(data, selectedRadioButton)}>決定</Button>
          </Grid>
          <Grid item xs={1} >
          <Button variant="contained"
                  type="submit"
          onClick={e => onBack(data)}>戻る</Button>
          </Grid>
          <Grid item xs={5} />
          <Grid item xs={3} />
          </Grid>
          </div>
  );
}

export default Home;
