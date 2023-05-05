const express = require('express');
const router = express.Router();
const { fetch_all_leagues, fetch_all_season_from_league, fetch_season_from_league, fetch_table_from_league, fetch_season_from_team } = require('../api');


router.get('/', async (req, res) => {
    var league_req = await fetch_all_leagues();
    var leagues = league_req.map(obj => obj.league);

    console.log(leagues);
    res.render('index', {leagues: leagues});
});

router.get('/id/:id', async (req, res) => {
    const id = req.params.id
    console.log(id)
});

router.all('*', (req, res) => {
    res.render('404');
});


module.exports = router;