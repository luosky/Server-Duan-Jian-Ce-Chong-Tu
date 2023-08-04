import express from 'express'
import { check_conflict_task } from './playground/check_conflict_task'

const app = express()
const port = 3000

// http trigger
app.get('/check_conflict_task', async (req, res) => {
  const record_id = req.query.record_id 
  const result = await check_conflict_task(record_id);
  res.send(result)
});


app.get('/', async (req, res) => {
  // await check_conflict_task();
  res.send('hello world')
});

app.listen(port, () => {
  // Code.....
  console.log('Listening on port: ' + port)
})