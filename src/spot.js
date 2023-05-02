import axios from "axios";

export class Spot {
  constructor(app) {
    this.app = app
  }

  getPairExchange() {
    this.app.get('/spot', async (req, res) => {
      const resp = await axios.get(`${process.env.BINANCE_SPOT_URL}/ticker/price?symbol=${req.query.symbol}`)
      res.send(resp.data)
    })
  }
}