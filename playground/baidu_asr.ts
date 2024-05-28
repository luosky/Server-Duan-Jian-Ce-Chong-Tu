import axios from 'axios';

const ACCESS_TOKEN = process.env['BAIDU_ACCESS_TOKEN']
  
const CREATE_JOB_API = "https://aip.baidubce.com/rpc/2.0/aasr/v1/create"
const GET_JOB_RESULT_API = "https://aip.baidubce.com/rpc/2.0/aasr/v1/query"


export async function create_job_for_url(url) {
  
  const post_url = CREATE_JOB_API + "?access_token=" + ACCESS_TOKEN
  // url = urlencode(url)
  const data = {
    "rate": "8000",
    "speech_url":  url,
    "pid": "1134",
    // "channel" : 2,
    "format": "wav"
    
  }

  console.log('data', data)
  const response = await axios.post(post_url, data)  
  console.log('response data:', response.data);
  const result = response.data
  if (result.task_id) {
    return result.task_id
  } else {
    return "创建任务失败："+result.error_msg
  }
}


export async function get_result_for_job(job_id) {

  const post_url = GET_JOB_RESULT_API + "?access_token=" + ACCESS_TOKEN
  // url = urlencode(url)
  console.log('job_id', job_id)
  const jobs = [job_id]
  console.log('jobs', jobs)
  const data = {
    "task_ids": jobs
  }

  console.log('data', data)
  const response = await axios.post(post_url, data)  
  console.log('response data:', response.data);

  const tasks = response.data.tasks_info
  console.log(`tasks length : ${tasks.length}`)
  const task = tasks[0]
  const task_id = task.task_id
  const status = task.task_status
  if (status == "Success") {
    const result = task.task_result.result
    const detail_result = task.task_result.detailed_result
    return { task_id,status,result,detail_result}
  } else {
    return {task_id,status}
  }
  
}