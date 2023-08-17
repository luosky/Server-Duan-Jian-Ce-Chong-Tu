import express from 'express'
import { check_conflict_task } from './playground/check_conflict_task'

const app = express()
const port = 3000

// http trigger
app.get('/check_conflict_task', async (req, res) => {
  const username = req.query.username 
  const result = await check_conflict_task(username);
  console.log('response : ' + result)
  
  // res.send(result)

  const data = { message: result };
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
  
});


app.get('/', async (req, res) => {
  // await check_conflict_task();
  res.send('hello world')
});

app.listen(port, () => {
  // Code.....
  console.log('Listening on port: ' + port)
})