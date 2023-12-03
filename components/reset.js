import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';

function onSubmit(event_names, block_names) {
    let post = {event_names: event_names,
                block_names: block_names};
    axios.post('/api/reset_db', post)
        .then((response) => {
        })
        .catch((e) => { console.log(e)})
}

function ResetButton({event_names, block_names, text}) {
    return (<div>
            <Container maxWidth="md">
            <Box style={{ minWidth: '840px' }}>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '80px' }}>
            <Button variant="contained" type="submit"
            style={{ backgroundColor: 'gray' }}
            onClick={e => onSubmit(event_names, block_names)}>{text}</Button>
            </Grid>
            </Box>
            </Container>
            </div>
           );
}

export default ResetButton;
