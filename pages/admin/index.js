import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import React from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import checkStyles from '../../styles/checks.module.css';

export default function Home() {
    const router = useRouter();
    const ToBlock = (block_number) => {
        router.push("/admin/block/" + block_number);
    }
    const ToNotificationRequest = () => {
        router.push("/admin/notification_request");
    }
    return (
            <div>
            <br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <h1><u>躰道 大会管理システム(β版)</u></h1>
            </Grid>
            <br/><br/><br/><br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <Button variant="contained" type="submit" onClick={e => ToBlock("a")}>Aコート</Button>
            </Grid>
            <br/><br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <Button variant="contained" type="submit" onClick={e => ToBlock("b")}>Bコート</Button>
            </Grid>
            <br/><br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <Button variant="contained" type="submit" onClick={e => ToBlock("c")}>Cコート</Button>
            </Grid>
            <br/><br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <br/><br/>
            <Button variant="contained" type="submit" onClick={e => ToBlock("d")}>Dコート</Button>
            </Grid>
            <br/><br/><br/><br/>
            <Grid container justifyContent="center" alignItems="center" style={{ height: '1vh' }}>
            <Button variant="contained" type="submit" onClick={e => ToNotificationRequest()}>司会用</Button>
            </Grid>
        </div>
    );
}
