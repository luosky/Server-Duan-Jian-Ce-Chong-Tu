import express from 'express'
import { check_conflict_task ,auto_create_task_for_requirement} from './playground/check_conflict_task'
import { create_job_for_url} from './playground/baidu_asr'

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

app.get('/auto_create_task_for_requirement',async(req,res) => {
  const requirement_id = req.query.requirement_id
  const result = await auto_create_task_for_requirement(requirement_id);
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

app.get('/create_baidu_asr_job', async (req, res) => {
  const url = req.query.url

  const task_id = await create_job_for_url(url);
  console.log('response : ' + task_id)
  const data = { 
    text : task_id //为了复用图片转文字的多维表格插件，这里输出还是以 text 为 key。  https://yellowduck.feishu.cn/docx/Q89SdbfZyoI50RxiwxlcTtP8nkb
  };
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
});

app.listen(port, () => {
  // Code.....
  console.log('Listening on port: ' + port)
});