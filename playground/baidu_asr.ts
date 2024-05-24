import axios from 'axios';

const ACCESS_TOKEN = process.env['BAIDU_ACCESS_TOKEN']
  
const CREATE_JOB_API = "https://aip.baidubce.com/rpc/2.0/aasr/v1/create"


export async function create_job_for_url(url) {
  
  const post_url = CREATE_JOB_API + "?access_token=" + ACCESS_TOKEN
  // url = urlencode(url)
  const data = {
    "rate": "8000",
    "speech_url":  url,
    "pid": "1134",
    "format": "pcm"
  }

  console.log('data', data)
  const response = await axios.post(post_url, data)  
  console.log('Success:', response.data);
  return response.data.task_id
  
}