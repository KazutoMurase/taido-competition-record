import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';

function ShowRedFlags(event_name, selectedRadioButton) {
    if (event_name === 'hokei_man') {
    return (<>
        {parseInt(selectedRadioButton) <= 2 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
        {parseInt(selectedRadioButton) <= 1 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
        {parseInt(selectedRadioButton) === 0 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
        </>);
    } else if (event_name === 'zissen_man') {
        return (<>
        <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="white" />
        {parseInt(selectedRadioButton) <= 0 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
                </>);
    }
}

function ShowWhiteFlags(event_name, selectedRadioButton) {
    if (event_name === 'hokei_man') {
    return (<>
          {parseInt(selectedRadioButton) >= 1 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> :
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="white" />}
          {parseInt(selectedRadioButton) >= 2 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
          {parseInt(selectedRadioButton) >= 3 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
        </>);
    } else if (event_name === 'zissen_man') {
        return (<>
        <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="white" />
        {parseInt(selectedRadioButton) >= 1 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
                </>);
    }
}

function Home() {
  const router = useRouter();
  const { event_name, id, return_url } = router.query;
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };

  const [data, setData] = useState([]);

  useEffect(() => {
      async function fetchData() {
      if (id !== undefined) {
         console.log(id);
         const response = await fetch('/api/get_game?event_name=' + event_name + '&id=' + id);
         const result = await response.json();
          if (result.left_player_flag !== null) {
              if (event_name === 'hokei_man') {
                  setSelectedRadioButton(3 - result.left_player_flag);
              } else if (event_name === 'zissen_man') {
                  setSelectedRadioButton(1 - result.left_player_flag);
              }
          }
          setData(result);
      }
    }
    fetchData();
  }, [id]);

  const onBack = () => {
      router.push('/' + return_url);
  }
  const onSubmit = (data, player_flag, event_name) => {
    let left_player_flag;
    if (event_name === 'hokei_man') {
        left_player_flag = (data.left_color === 'white' ? player_flag : 3 - player_flag);
    } else if (event_name === 'zissen_man') {
        left_player_flag = (data.left_color === 'white' ? player_flag : 1 - player_flag);
    }
    let post = {id: data.id,
                event_name: event_name,
                left_player_flag: left_player_flag};
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
    axios.post('/api/record', post)
          .then((response) => {
              console.log(response);
          })
          .catch((e) => { console.log(e)})
    router.push('/' + return_url);
  }

  let no_game_red_winner;
  let no_game_white_winner;
  if (event_name === 'hokei_man') {
      no_game_red_winner = -1;
      no_game_white_winner = 4;
  } else if (event_name === 'zissen_man') {
      no_game_red_winner = -1;
      no_game_white_winner = 2;
  }

  return (
          <div>
          <Grid container>
          <Grid item xs={4} />
          <Grid item xs={4}>
          <h2>第{data.id}試合</h2>
          </Grid>
          <Grid item xs={4} />
          <Grid item xs={1} />
          <Grid item xs={5}>
          <Button variant="contained"
          type="submit"
      onClick={e => onSubmit(data, no_game_red_winner, event_name)}>赤不戦勝</Button>
          <h1>{data.left_color === 'white' ? data.right_name : data.left_name}</h1>
          {ShowRedFlags(event_name, selectedRadioButton)}
          </Grid>
          <Grid item xs={5}>
          <Button variant="contained"
                  type="submit"
      onClick={e => onSubmit(data, no_game_white_winner, event_name)}>白不戦勝</Button>
          <h1>{data.left_color === 'white' ? data.left_name : data.right_name}</h1>
          {ShowWhiteFlags(event_name, selectedRadioButton)}
          </Grid>
          <Grid item xs={1} />
          <Grid item xs={2} />
          <Grid item xs={5}>
          {event_name === 'hokei_man' ?
           (<><h2>白の旗</h2>
            <input class="radio-inline__input" type="radio" id="choice0" name="contact" value="0"
            onChange={handleRadioButtonChange} defaultChecked={parseInt(selectedRadioButton)===0} />
            <label class="radio-inline__label" for="choice0">0</label>
            <input class="radio-inline__input" type="radio" id="choice1" name="contact" value="1"
            onChange={handleRadioButtonChange} defaultChecked={parseInt(selectedRadioButton)===1} />
            <label class="radio-inline__label" for="choice1">1</label>
            <input class="radio-inline__input" type="radio" id="choice2" name="contact" value="2"
            onChange={handleRadioButtonChange} defaultChecked={parseInt(selectedRadioButton)===2} />
            <label class="radio-inline__label" for="choice2">2</label>
            <input class="radio-inline__input" type="radio" id="choice3" name="contact" value="3"
            onChange={handleRadioButtonChange} defaultChecked={parseInt(selectedRadioButton)===3} />
            <label class="radio-inline__label" for="choice3">3</label></>
           ) :
           (<>
            <input class="radio-inline__input" type="radio" id="choice0" name="contact" value="0"
            onChange={handleRadioButtonChange} defaultChecked={parseInt(selectedRadioButton)===0} />
            <label class="radio-inline__label" for="choice0">赤勝利</label>
            <input class="radio-inline__input" type="radio" id="choice1" name="contact" value="1"
            onChange={handleRadioButtonChange}  defaultChecked={parseInt(selectedRadioButton)===1} />
            <label class="radio-inline__label" for="choice1">白勝利</label>
            </>)}
          <br />
          <br />
          </Grid>
          <Grid item xs={5} />
          <Grid item xs={4} />
          <Grid item xs={1} >
          <Button variant="contained"
                  type="submit"
          onClick={e => onSubmit(data, selectedRadioButton, event_name)}>決定</Button>
          </Grid>
          <Grid item xs={1} >
          <Button variant="contained"
                  type="submit"
          onClick={onBack}>戻る</Button>
          </Grid>
          <Grid item xs={5} />
          <Grid item xs={3} />
          </Grid>
          </div>
  );
}

export default Home;
