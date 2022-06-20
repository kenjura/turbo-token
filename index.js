const express = require('express');
const app = express();
const port = process.env.PORT || 3042;

app.get('/api', (req, res) => {
  res.send('this is turbo-token');
});

//app.get('/token/:url')

app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});