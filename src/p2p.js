import axios from "axios";

export class P2p {
  constructor(app) {
    this.app = app;
  }

  postP2p() {
    this.app.post('/p2p', (req, res) => {
      const resp = axios.post(`${process.env.BINANCE_P2P_URL}/friendly/c2c/adv/search`, req.body, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      resp.then(e => {
        res.send(e.data.data)
      })
    })
  }
}