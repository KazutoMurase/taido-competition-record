import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import React from 'react';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import checkStyles from '../styles/checks.module.css';

export default function Home() {
    const router = useRouter();
    const ToResult = (event_name) => {
        router.push("/results/" + event_name);
    }
    return (
            <div>
            <br/>
            <Container maxWidth="md">
            <Grid container justifyContent="center" alignItems="center" style={{ height: '100px' }}>
            <h1><u>躰道 第56回全日本大会 個人競技速報</u></h1>
            </Grid>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '60px' }}>
            <Button variant="contained" type="submit" onClick={e => ToResult("zissen_man")}>男子個人実戦</Button>
            </Grid>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '60px' }}>
            <Button variant="contained" type="submit" onClick={e => ToResult("zissen_woman")}>女子個人実戦</Button>
            </Grid>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '60px' }}>
            <Button variant="contained" type="submit" onClick={e => ToResult("hokei_man")}>男子個人法形</Button>
            </Grid>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '60px' }}>
            <Button variant="contained" type="submit" onClick={e => ToResult("hokei_woman")}>女子個人法形</Button>
            </Grid>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '60px' }}>
            <Button variant="contained" type="submit" onClick={e => ToResult("hokei_sonen")}>　壮年法形　</Button>
            </Grid>
        </Container>
        </div>
    );
}
