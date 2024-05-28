import express from 'express'
import cors from 'cors';

import { check_conflict_task ,auto_create_task_for_requirement} from './playground/check_conflict_task'
import { create_job_for_url, get_result_for_job} from './playground/baidu_asr'

const app = express()
// 允许所有域进行跨域请求
app.use(cors());
// 解析 JSON 格式的请求体
app.use(express.json());
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
  res.send('hello world111')
});

app.post('/create_baidu_asr_job', async (req, res) => {
  // const url = req.query.url
  const {url} = req.body
  console.log(`req : ${req}`)
  console.log(`url : ${url}`)
  const task_id = await create_job_for_url(url);
  console.log('response : ' + task_id)
  const data = { 
    text : task_id //为了复用图片转文字的多维表格插件，这里输出还是以 text 为 key。  https://yellowduck.feishu.cn/docx/Q89SdbfZyoI50RxiwxlcTtP8nkb
  };
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
});

app.post('/get_result_for_job', async (req, res) => {
  // const url = req.query.url
  const {job} = req.body
  console.log(`job : ${job}`)
  const data = await get_result_for_job(job);
  console.log('return response data: ' + data)
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
});

app.listen(port, () => {
  // Code.....
  console.log('Listening on port: ' + port)
});