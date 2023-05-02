import Express from 'express'
import cors from 'cors'
import bodyParser from "body-parser";
import * as dotenv from 'dotenv';
import {P2p} from "./p2p.js";
import {Spot} from "./spot.js";

dotenv.config();

const app = new Express();

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const p2p = new P2p(app)
p2p.postP2p()

const spot= new Spot(app)
spot.getPairExchange()

app.listen(80, () => {
  console.log('Start server')
})