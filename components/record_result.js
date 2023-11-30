import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import FlagCircleRoundedIcon from '@mui/icons-material/FlagCircleRounded';


function onSubmit(data, player_flag, block_number, event_name, function_after_post) {
    let left_player_flag;
    if (event_name.includes('hokei')) {
        left_player_flag = (data.left_color === 'white' ? 3 - player_flag : player_flag);
    } else if (event_name.includes('zissen')) {
        left_player_flag = (data.left_color === 'white' ? player_flag : 1 - player_flag);
    }
    let post = {id: data.id,
                event_name: event_name,
                left_player_flag: left_player_flag,
                update_block: block_number};
    if (event_name.includes('hokei')) {
        if (parseInt(left_player_flag) > 1) {
            post['next_player_id'] = data.left_player_id;
            post['loser_id'] = data.right_player_id;
        } else {
            post['next_player_id'] = data.right_player_id;
            post['loser_id'] = data.left_player_id;
        }
    } else if (event_name.includes('zissen')) {
        if (parseInt(left_player_flag) > 0) {
            post['next_player_id'] = data.left_player_id;
            post['loser_id'] = data.right_player_id;
        } else {
            post['next_player_id'] = data.right_player_id;
            post['loser_id'] = data.left_player_id;
        }
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
        })
        .catch((e) => { console.log(e)})
    window.location.reload();
}

function onBack(data, block_number, function_after_post) {
    let post = {id: data.id-1,
                update_block: block_number};
    axios.post('/api/back', post)
        .then((response) => {
            function_after_post();
        })
        .catch((e) => { console.log(e)})
}

function ShowRedFlags(event_name, initialRadioButton, selectedRadioButton) {
    const flag = (selectedRadioButton === null) ? parseInt(initialRadioButton) : parseInt(selectedRadioButton);
    if (event_name.includes('hokei')) {
        if (flag === 4) {
            return (<></>);
        }
    return (<>
        {flag >= 1 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
        {flag >= 2 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
        {flag >= 3 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
        </>);
    } else if (event_name.includes('zissen')) {
        return (<>
        <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="white" />
        {flag === 0 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="red" /> : null}
                </>);
    }
}

function ShowWhiteFlags(event_name, initialRadioButton, selectedRadioButton) {
    const flag = (selectedRadioButton === null) ? parseInt(initialRadioButton) : parseInt(selectedRadioButton);
    if (event_name.includes('hokei')) {
        if (flag === -1) {
            return (<></>);
        }
    return (<>
          {flag <= 0 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
          {flag <= 1 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
          {flag <= 2 ?
           <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
        </>);
    } else if (event_name.includes('zissen')) {
        return (<>
        <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="white" />
        {flag >= 1 ?
         <FlagCircleRoundedIcon sx={{ fontSize: 60 }} htmlColor="gray" /> : null}
                </>);
    }
}

function ShowLeftName(data) {
    if (data.left_retire) {
        return (<s><h1>{data.left_name}</h1></s>);
    }
    return (<span><h1>{data.left_name}</h1></span>);
}

function ShowRightName(data) {
    if (data.right_retire) {
        return (<s><h1>{data.right_name}</h1></s>);
    }
    return (<span><h1>{data.right_name}</h1></span>);
}

function RecordResult({block_number, event_name, schedule_id}) {
  const [initialRadioButton, setInitialRadioButton] = useState(null);
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
      setSelectedRadioButton(event.target.value);
  };
        const router = useRouter();

  const [data, setData] = useState([]);
  const fetchData = async () => {
      const response = await fetch('/api/current_block?block_number=' + block_number + "&schedule_id=" + schedule_id);
      const result = await response.json();
      if (result.length === 0) {
          router.push("/admin/block?block_number=" + block_number);
      }
      setData(result);
      if (result.left_player_flag !== null &&
          result.left_player_flag !== undefined) {
          if (result.left_color === 'red') {
              if (event_name.includes('hokei')) {
                  setInitialRadioButton(result.left_player_flag);
              } else if (event_name.includes('zissen')) {
                  setInitialRadioButton(1 - result.left_player_flag);
              }
          } else {
              if (event_name.includes('hokei')) {
                  setInitialRadioButton(3 - result.left_player_flag);
              } else if (event_name.includes('zissen')) {
                  setInitialRadioButton(result.left_player_flag);
              }
          }
      }
  }
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
        setSelectedRadioButton(null);
        setInitialRadioButton(null);
    };

    const updateChecked = (target_value) => {
        if (selectedRadioButton === null) {
            if (initialRadioButton === null) {
                return false;
            }
            return (parseInt(initialRadioButton)===target_value);
        }
        return (parseInt(selectedRadioButton)===target_value);
    }

    let no_game_red_winner;
    let no_game_white_winner;
    if (event_name.includes('hokei')) {
        no_game_red_winner = 4;
        no_game_white_winner = -1;
    } else if (event_name.includes('zissen')) {
        no_game_red_winner = -1;
        no_game_white_winner = 2;
    }

  return (
          <div>
          <Container maxWidth="md">
          <Box style={{ minWidth: '1100px' }}>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '8vh' }}>
          <h2><u>コート{block_number.toUpperCase()}</u></h2>
          </Grid>
          <br/>
          <br/>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '8vh' }}>
          <h2>第{data.id}試合</h2>
          </Grid>
          <br/>
          <br/>
          <Grid container>
          <Grid item xs={3} />
          <Grid item xs={4} style={{height: '25vh' }}>
          <Button variant="contained"
      type="submit"
      onClick={e => onSubmit(data, no_game_red_winner, block_number, event_name)}>赤不戦勝</Button>
          <h3>{data.left_color === 'white' ? data.right_group_name : data.left_group_name}</h3>
          {data.left_color === 'white' ? ShowRightName(data) : ShowLeftName(data)}
      {ShowRedFlags(event_name, initialRadioButton, selectedRadioButton)}
      </Grid>
          <Grid item xs={4}>
          <Button variant="contained"
      type="submit"
      onClick={e => onSubmit(data, no_game_white_winner, block_number, event_name)}>白不戦勝</Button>
          <h3>{data.left_color === 'white' ? data.left_group_name : data.right_group_name}</h3>
          {data.left_color === 'white' ? ShowLeftName(data) : ShowRightName(data)}
      {ShowWhiteFlags(event_name, initialRadioButton, selectedRadioButton)}
      </Grid>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '8vh' }}>
          {event_name.includes('hokei') ? (<div><h2>赤の旗</h2></div>) : ''}
      </Grid>
          <br/>
          <br/>
          <br/>
          <Grid container justifyContent="center" alignItems="center" style={{ height: '8vh' }}>
          {event_name.includes('hokei') ?
           (<>
            <input class="radio-inline__input" type="radio" id="choice0" name="contact" value="0"
            onChange={handleRadioButtonChange} checked={updateChecked(0)} />
            <label class="radio-inline__label" for="choice0">0</label>
            <input class="radio-inline__input" type="radio" id="choice1" name="contact" value="1"
            onChange={handleRadioButtonChange}  checked={updateChecked(1)} />
            <label class="radio-inline__label" for="choice1">1</label>
            <input class="radio-inline__input" type="radio" id="choice2" name="contact" value="2"
            onChange={handleRadioButtonChange}  checked={updateChecked(2)} />
            <label class="radio-inline__label" for="choice2">2</label>
            <input class="radio-inline__input" type="radio" id="choice3" name="contact" value="3"
            onChange={handleRadioButtonChange}  checked={updateChecked(3)} />
            <label class="radio-inline__label" for="choice3">3</label></>
           ) :
           (<>
            <input class="radio-inline__input" type="radio" id="choice0" name="contact" value="0"
            onChange={handleRadioButtonChange} checked={updateChecked(0)} />
            <label class="radio-inline__label" for="choice0">赤勝利</label>
            <input class="radio-inline__input" type="radio" id="choice1" name="contact" value="1"
            onChange={handleRadioButtonChange}  checked={updateChecked(1)} />
            <label class="radio-inline__label" for="choice1">白勝利</label>
            </>)}
          </Grid>
          </Grid>
          <br />
          <br />
          <Grid container justifyContent="center" alignItems="center" style={{ height: '10vh' }}>
          <Button variant="contained"
      type="submit"
      onClick={e => onSubmit(data, (selectedRadioButton === null) ? initialRadioButton : selectedRadioButton,
                             block_number, event_name, forceFetchData)}>決定</Button>
          &nbsp;&nbsp;
          <Button variant="contained"
                  type="submit"
      onClick={e => onBack(data, block_number, forceFetchData)}>戻る</Button>
          </Grid>
          </Box>
          </Container>
          </div>
  );
}

export default RecordResult;
